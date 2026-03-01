// @ts-nocheck
// Pixel-size detection uses two complementary signals:
// 1) Spatial gradient projection + autocorrelation for dominant block period/phase.
// 2) 1D sampled stripe periodicity (windowed autocorrelation) as a fallback.
const SAMPLE_COUNT = 20;
const MAX_PERIOD_CAP = 128;
const MIN_CONFIDENCE = 1.2;
const STD_FLOOR = 2;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function sampleIndices(
  length: number,
  count: number,
  startRatio = 0.1,
  endRatio = 0.9,
): number[] {
  if (length <= 0) return [];
  if (count <= 1) return [Math.floor(length * ((startRatio + endRatio) / 2))];
  const start = length * startRatio;
  const end = length * endRatio;
  const indices: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const pos = Math.floor(start + (end - start) * t);
    if (pos >= 0 && pos < length) indices.push(pos);
  }
  return Array.from(new Set(indices));
}

function hanningWindow(n: number): Float32Array {
  const win = new Float32Array(n);
  if (n === 1) {
    win[0] = 1;
    return win;
  }
  for (let i = 0; i < n; i++) {
    win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  }
  return win;
}

function stdDev(values: Float32Array): number {
  let mean = 0;
  for (let i = 0; i < values.length; i++) mean += values[i];
  mean /= values.length;
  let variance = 0;
  for (let i = 0; i < values.length; i++) {
    const d = values[i] - mean;
    variance += d * d;
  }
  variance /= values.length;
  return Math.sqrt(variance);
}

function medianBlur3x3(src: Float32Array, w: number, h: number): Float32Array {
  const dst = new Float32Array(w * h);
  const window = new Float32Array(9);
  for (let y = 0; y < h; y++) {
    const y0 = y === 0 ? 0 : y - 1;
    const y2 = y + 1 < h ? y + 1 : h - 1;
    for (let x = 0; x < w; x++) {
      const x0 = x === 0 ? 0 : x - 1;
      const x2 = x + 1 < w ? x + 1 : w - 1;
      window[0] = src[y0 * w + x0];
      window[1] = src[y0 * w + x];
      window[2] = src[y0 * w + x2];
      window[3] = src[y * w + x0];
      window[4] = src[y * w + x];
      window[5] = src[y * w + x2];
      window[6] = src[y2 * w + x0];
      window[7] = src[y2 * w + x];
      window[8] = src[y2 * w + x2];
      for (let i = 1; i < 9; i++) {
        const v = window[i];
        let j = i - 1;
        while (j >= 0 && window[j] > v) {
          window[j + 1] = window[j];
          j--;
        }
        window[j + 1] = v;
      }
      dst[y * w + x] = window[4];
    }
  }
  return dst;
}

function periodOf(
  signal: Float32Array,
  maxPeriod: number,
  window: Float32Array,
): { period: number; conf: number } | null {
  // Estimate periodicity from a 1D stripe:
  // - de-mean + Hanning window to suppress DC/leakage
  // - evaluate autocorrelation across lags
  // - pick stable local peaks and return a z-score-like confidence
  const n = signal.length;
  if (n < 4) return null;

  let mean = 0;
  for (let i = 0; i < n; i++) mean += signal[i];
  mean /= n;

  const centered = new Float32Array(n);
  for (let i = 0; i < n; i++) centered[i] = (signal[i] - mean) * window[i];

  const maxLag = Math.min(maxPeriod, n - 2);
  const scores = new Float64Array(maxLag + 1);
  for (let lag = 2; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += centered[i] * centered[i + lag];
    }
    scores[lag] = sum / (n - lag);
  }

  let meanScore = 0;
  let count = 0;
  for (let lag = 2; lag <= maxLag; lag++) {
    meanScore += scores[lag];
    count++;
  }
  meanScore /= Math.max(1, count);

  let varScore = 0;
  for (let lag = 2; lag <= maxLag; lag++) {
    const d = scores[lag] - meanScore;
    varScore += d * d;
  }
  const stdScore = Math.sqrt(varScore / Math.max(1, count));

  const peaks: Array<{ lag: number; score: number }> = [];
  for (let lag = 2; lag < maxLag; lag++) {
    const s = scores[lag];
    if (
      s > scores[lag - 1] &&
      s > scores[lag + 1] &&
      s > meanScore + 1.2 * stdScore
    ) {
      peaks.push({ lag, score: s });
    }
  }
  if (peaks.length === 0) return null;

  peaks.sort((a, b) => b.score - a.score);
  const topScore = peaks[0].score;
  let bestLag = peaks[0].lag;
  for (const peak of peaks) {
    if (peak.score >= topScore * 0.7 && peak.lag < bestLag) {
      bestLag = peak.lag;
    }
  }

  const confidence = (scores[bestLag] - meanScore) / (stdScore + 1e-5);
  return { period: bestLag, conf: confidence };
}

function findPeriodAndPhase(
  proj: Float64Array,
  maxSize: number,
): { size: number; offset: number; conf: number } {
  // proj is an edge-energy projection (sum of gradient magnitude per axis bin).
  // Autocorrelation peak gives candidate block size; folded histogram gives phase.
  const n = proj.length;
  if (n < 4) return { size: 1, offset: 0, conf: 0 };

  let mean = 0;
  for (let i = 0; i < n; i++) mean += proj[i];
  mean /= n;
  if (mean === 0) return { size: 1, offset: 0, conf: 0 };

  const centered = new Float64Array(n);
  for (let i = 0; i < n; i++) centered[i] = proj[i] - mean;

  const maxLag = Math.min(maxSize + 1, n - 1);
  const autocorr = new Float64Array(maxLag + 1);
  for (let lag = 0; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += centered[i] * centered[i + lag];
    }
    autocorr[lag] = sum;
  }

  const peaks: Array<{ size: number; score: number }> = [];
  const peakLimit = Math.min(maxSize, n - 2);
  for (let i = 2; i <= peakLimit; i++) {
    if (
      autocorr[i] > autocorr[i - 1] &&
      autocorr[i] > autocorr[i + 1] &&
      autocorr[i] > 0
    ) {
      peaks.push({ size: i, score: autocorr[i] / (n - i) });
    }
  }
  if (peaks.length === 0) return { size: 1, offset: 0, conf: 0 };

  peaks.sort((a, b) => b.score - a.score);
  const topScore = peaks[0].score;
  let bestSize = peaks[0].size;
  for (const peak of peaks) {
    if (peak.score > 0.7 * topScore && peak.size < bestSize) {
      const m = bestSize % peak.size;
      if (m === 0 || m === 1 || m === peak.size - 1) bestSize = peak.size;
    }
  }

  const folded = new Float64Array(bestSize);
  for (let i = 0; i < n; i++) folded[i % bestSize] += proj[i];
  let bestOffset = 0;
  let bestVal = -Infinity;
  let sumFolded = 0;
  for (let i = 0; i < bestSize; i++) {
    sumFolded += folded[i];
    if (folded[i] > bestVal) {
      bestVal = folded[i];
      bestOffset = i;
    }
  }
  const meanFolded = sumFolded / bestSize;
  const conf = (bestVal - meanFolded) / (meanFolded + 1e-5);

  return { size: bestSize, offset: bestOffset, conf };
}

function detectPixelSizeFft(
  gray: Float32Array,
  w: number,
  h: number,
): { size: number; conf: number } {
  // Frequency-domain fallback: sample representative rows/cols, ignore low-texture
  // stripes, then aggregate median period from confident candidates.
  const rows = sampleIndices(h, SAMPLE_COUNT);
  const cols = sampleIndices(w, SAMPLE_COUNT);
  const periods: Array<{ period: number; conf: number }> = [];

  const rowSignal = new Float32Array(w);
  const colSignal = new Float32Array(h);

  const rowStds = rows.map((y) => {
    const offset = y * w;
    for (let x = 0; x < w; x++) rowSignal[x] = gray[offset + x];
    return stdDev(rowSignal);
  });
  const colStds = cols.map((x) => {
    for (let y = 0; y < h; y++) colSignal[y] = gray[y * w + x];
    return stdDev(colSignal);
  });

  const medianStd = median([...rowStds, ...colStds]);
  const stdThreshold = Math.max(STD_FLOOR, medianStd * 0.6);

  const rowWindow = hanningWindow(w);
  const colWindow = hanningWindow(h);
  const maxPeriod = Math.min(MAX_PERIOD_CAP, Math.floor(Math.min(w, h) / 2));
  const maxPeriodClamped = Math.max(2, maxPeriod);

  for (let i = 0; i < rows.length; i++) {
    const y = rows[i];
    const std = rowStds[i];
    if (std < stdThreshold) continue;
    const offset = y * w;
    for (let x = 0; x < w; x++) rowSignal[x] = gray[offset + x];
    const p = periodOf(rowSignal, maxPeriodClamped, rowWindow);
    if (p) periods.push(p);
  }

  for (let i = 0; i < cols.length; i++) {
    const x = cols[i];
    const std = colStds[i];
    if (std < stdThreshold) continue;
    for (let y = 0; y < h; y++) colSignal[y] = gray[y * w + x];
    const p = periodOf(colSignal, maxPeriodClamped, colWindow);
    if (p) periods.push(p);
  }

  if (periods.length === 0) return { size: 1, conf: 0 };

  const confident = periods.filter((p) => p.conf >= MIN_CONFIDENCE);
  const selected = confident.length ? confident : periods;
  const size = Math.trunc(median(selected.map((p) => p.period)));
  const conf = selected.reduce((sum, p) => sum + p.conf, 0) / selected.length;
  return { size, conf };
}

export type PixelSizeResult = {
  size: number;
  offsetX: number;
  offsetY: number;
};

export function detectPixelSize(data: ImageData): PixelSizeResult {
  // Main path:
  // - convert to grayscale and denoise with 3x3 median
  // - build x/y edge-energy projections
  // - detect period+phase by autocorrelation
  // - fallback to sampled-stripe periodicity if confidence is weak
  const { width: w, height: h, data: rgba } = data;
  if (w < 2 || h < 2) return { size: 1, offsetX: 0, offsetY: 0 };

  const src = new Uint8ClampedArray(rgba);
  for (let i = 0; i < w * h; i++) {
    if (src[i * 4 + 3] === 0) {
      src[i * 4] = 255;
      src[i * 4 + 1] = 255;
      src[i * 4 + 2] = 255;
    }
  }

  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = src[i * 4],
      g = src[i * 4 + 1],
      b = src[i * 4 + 2];
    gray[i] = (r * 4899 + g * 9617 + b * 1868 + 8192) >> 14;
  }

  const blurred = Math.min(w, h) >= 3 ? medianBlur3x3(gray, w, h) : gray;

  const projX = new Float64Array(w);
  const projY = new Float64Array(h);

  for (let y = 0; y < h; y++) {
    const y0 = y === 0 ? 0 : y - 1;
    const y2 = y + 1 < h ? y + 1 : h - 1;
    for (let x = 0; x < w; x++) {
      const x0 = x === 0 ? 0 : x - 1;
      const x2 = x + 1 < w ? x + 1 : w - 1;

      const a00 = blurred[y0 * w + x0];
      const a01 = blurred[y0 * w + x];
      const a02 = blurred[y0 * w + x2];
      const a10 = blurred[y * w + x0];
      const a12 = blurred[y * w + x2];
      const a20 = blurred[y2 * w + x0];
      const a21 = blurred[y2 * w + x];
      const a22 = blurred[y2 * w + x2];

      const gx = -3 * a00 + 3 * a02 - 10 * a10 + 10 * a12 - 3 * a20 + 3 * a22;
      const gy = -3 * a00 - 10 * a01 - 3 * a02 + 3 * a20 + 10 * a21 + 3 * a22;

      projX[x] += Math.abs(gx);
      projY[y] += Math.abs(gy);
    }
  }

  const maxSize = Math.max(2, Math.min(64, Math.floor(Math.min(w, h) / 2)));

  const xResult = findPeriodAndPhase(projX, maxSize);
  const yResult = findPeriodAndPhase(projY, maxSize);

  let finalSize: number;
  if (xResult.conf > yResult.conf * 1.2) {
    finalSize = xResult.size;
  } else if (yResult.conf > xResult.conf * 1.2) {
    finalSize = yResult.size;
  } else {
    finalSize = Math.min(xResult.size, yResult.size);
  }

  if (Math.max(xResult.conf, yResult.conf) < 0.5) {
    const fftResult = detectPixelSizeFft(blurred, w, h);
    if (fftResult.size > 1) finalSize = fftResult.size;
  }

  let finalOffsetX = 0;
  let finalOffsetY = 0;

  if (finalSize > 1) {
    const foldedX = new Float64Array(finalSize);
    for (let x = 0; x < w; x++) foldedX[x % finalSize] += projX[x];
    let bestX = 0;
    let maxValX = -Infinity;
    for (let i = 0; i < finalSize; i++) {
      if (foldedX[i] > maxValX) {
        maxValX = foldedX[i];
        bestX = i;
      }
    }
    finalOffsetX = bestX;

    const foldedY = new Float64Array(finalSize);
    for (let y = 0; y < h; y++) foldedY[y % finalSize] += projY[y];
    let bestY = 0;
    let maxValY = -Infinity;
    for (let i = 0; i < finalSize; i++) {
      if (foldedY[i] > maxValY) {
        maxValY = foldedY[i];
        bestY = i;
      }
    }
    finalOffsetY = bestY;
  }

  return { size: finalSize, offsetX: finalOffsetX, offsetY: finalOffsetY };
}
