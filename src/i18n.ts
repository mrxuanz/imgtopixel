import { ref, watch } from "vue";

const LOCALE_KEY = "pixel-locale";

export const LOCALES = ["en", "zh-CN", "ja"] as const;
export type Locale = (typeof LOCALES)[number];

export const localeOptions: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "zh-CN", label: "中文" },
  { value: "ja", label: "日本語" },
];

interface MessageMap {
  [key: string]: string | MessageMap;
}

const messages: Record<Locale, MessageMap> = {
  en: {
    common: {
      close: "Close",
      delete: "Delete",
      rename: "Rename",
      add: "Add",
      openMenu: "Open menu",
      collapse: "Collapse",
      expand: "Expand",
      download: "Download",
      preview: "Click to preview",
      remove: "Remove",
    },
    sidebar: {
      new: "New workflow",
      github: "Open on GitHub",
      searchPlaceholder: "Search workflows...",
      empty: "No workflows",
      noMatch: "No matches",
    },
    canvas: {
      zoomIn: "Zoom in (+)",
      zoomOut: "Zoom out (-)",
      fitView: "Fit view",
      lock: "Lock canvas",
      unlock: "Unlock canvas",
      run: "▶ Run",
      running: "Running...",
      addNode: "Add node",
      connectNode: "Connect new node",
      empty: "Select or create a workflow",
    },
    nodes: {
      upload: "Upload image",
      removeBg: "Remove background",
      aiRemoveBg: "AI remove background",
      pixelate: "Pixelate",
      addNext: "Add next node",
      deleteNode: "Delete node",
    },
    nodesDesc: {
      upload: "Upload images from your device",
      removeBg: "Automatically remove image background",
      aiRemoveBg: "Use an AI model to remove backgrounds precisely",
      pixelate: "Convert images into pixel art",
    },
    upload: {
      drop: "Drag or click to upload",
      addMore: "{count} images · Click to add more",
      zoom: "Click to enlarge",
      removeFile: "Remove",
    },
    removeBg: { tolerance: "Tolerance" },
    aiRemoveBg: { hint: "Automatically remove background using an AI model" },
    pixelate: {
      mode: "Mode",
      modeAuto: "Auto detect",
      modeManualSize: "Manual pixel size",
      modeManualTarget: "Target size",
      pixelSize: "Pixel size",
      targetW: "Target width",
      targetH: "Height",
    },
    edge: { delete: "Delete connection" },
    result: {
      title: "Results",
      count: "{count} images",
      empty: "Run the workflow to see results here",
      preview: "Click to preview",
    },
    workflow: {
      nameWithIndex: "Workflow {index}",
      preset: {
        pixelateRemoveBg: "Pixelate + Remove Background",
      },
    },
    language: {
      label: "Language",
    },
  },
  "zh-CN": {
    common: {
      close: "关闭",
      delete: "删除",
      rename: "重命名",
      add: "添加",
      openMenu: "打开菜单",
      collapse: "折叠",
      expand: "展开",
      download: "下载",
      preview: "点击预览",
      remove: "移除",
    },
    sidebar: {
      new: "新建工作流",
      github: "在 GitHub 打开",
      searchPlaceholder: "搜索工作流...",
      empty: "暂无工作流",
      noMatch: "无匹配结果",
    },
    canvas: {
      zoomIn: "放大 (+)",
      zoomOut: "缩小 (-)",
      fitView: "适应视图",
      lock: "锁定画布",
      unlock: "解锁画布",
      run: "▶ 运行",
      running: "运行中...",
      addNode: "添加节点",
      connectNode: "连接新节点",
      empty: "请选择或创建工作流",
    },
    nodes: {
      upload: "上传图片",
      removeBg: "去除背景",
      aiRemoveBg: "AI 去除背景",
      pixelate: "像素化",
      addNext: "添加下一个节点",
      deleteNode: "删除节点",
    },
    nodesDesc: {
      upload: "从本地上传图片文件",
      removeBg: "自动去除图片背景",
      aiRemoveBg: "使用 AI 模型精准去除背景",
      pixelate: "将图片转换为像素风格",
    },
    upload: {
      drop: "拖拽或点击上传",
      addMore: "{count} 张图片 · 点击继续添加",
      zoom: "点击放大",
      removeFile: "移除",
    },
    removeBg: { tolerance: "容差" },
    aiRemoveBg: { hint: "使用 AI 模型自动去除背景" },
    pixelate: {
      mode: "模式",
      modeAuto: "自动检测",
      modeManualSize: "手动像素大小",
      modeManualTarget: "目标尺寸",
      pixelSize: "像素大小",
      targetW: "目标宽",
      targetH: "高",
    },
    edge: { delete: "删除连接" },
    result: {
      title: "结果",
      count: "{count} 张",
      empty: "运行工作流后结果将显示在这里",
      preview: "点击预览",
    },
    workflow: {
      nameWithIndex: "工作流 {index}",
      preset: {
        pixelateRemoveBg: "像素化加去背景",
      },
    },
    language: {
      label: "语言",
    },
  },
  ja: {
    common: {
      close: "閉じる",
      delete: "削除",
      rename: "名前を変更",
      add: "追加",
      openMenu: "メニューを開く",
      collapse: "折りたたむ",
      expand: "展開",
      download: "ダウンロード",
      preview: "クリックしてプレビュー",
      remove: "削除",
    },
    sidebar: {
      new: "新しいワークフロー",
      github: "GitHub で開く",
      searchPlaceholder: "ワークフローを検索...",
      empty: "ワークフローがありません",
      noMatch: "一致する結果がありません",
    },
    canvas: {
      zoomIn: "拡大 (+)",
      zoomOut: "縮小 (-)",
      fitView: "全体表示",
      lock: "キャンバスをロック",
      unlock: "キャンバスのロックを解除",
      run: "▶ 実行",
      running: "実行中...",
      addNode: "ノードを追加",
      connectNode: "新しいノードを接続",
      empty: "ワークフローを選択または作成してください",
    },
    nodes: {
      upload: "画像をアップロード",
      removeBg: "背景を削除",
      aiRemoveBg: "AI 背景削除",
      pixelate: "ピクセル化",
      addNext: "次のノードを追加",
      deleteNode: "ノードを削除",
    },
    nodesDesc: {
      upload: "ローカルの画像ファイルをアップロード",
      removeBg: "画像の背景を自動で削除",
      aiRemoveBg: "AI モデルで背景を高精度に削除",
      pixelate: "画像をピクセルアートに変換",
    },
    upload: {
      drop: "ドラッグまたはクリックしてアップロード",
      addMore: "{count} 枚 · クリックして追加",
      zoom: "クリックして拡大",
      removeFile: "削除",
    },
    removeBg: { tolerance: "許容差" },
    aiRemoveBg: { hint: "AI モデルで背景を自動削除" },
    pixelate: {
      mode: "モード",
      modeAuto: "自動検出",
      modeManualSize: "手動ピクセルサイズ",
      modeManualTarget: "目標サイズ",
      pixelSize: "ピクセルサイズ",
      targetW: "幅",
      targetH: "高さ",
    },
    edge: { delete: "接続を削除" },
    result: {
      title: "結果",
      count: "{count} 枚",
      empty: "ワークフローを実行するとここに結果が表示されます",
      preview: "クリックしてプレビュー",
    },
    workflow: {
      nameWithIndex: "ワークフロー {index}",
      preset: {
        pixelateRemoveBg: "ピクセル化 + 背景削除",
      },
    },
    language: {
      label: "言語",
    },
  },
};

function normalizeLocale(input?: string | null): Locale | null {
  if (!input) return null;
  const lower = input.toLowerCase();
  if (lower.startsWith("zh")) return "zh-CN";
  if (lower.startsWith("ja")) return "ja";
  if (lower.startsWith("en")) return "en";
  return null;
}

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const langs = navigator.languages ?? [navigator.language];
  for (const lang of langs) {
    const normalized = normalizeLocale(lang);
    if (normalized) return normalized;
  }
  return "en";
}

function loadStoredLocale(): Locale | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return normalizeLocale(localStorage.getItem(LOCALE_KEY));
  } catch {
    return null;
  }
}

const stored = loadStoredLocale();
const locale = ref<Locale>(stored ?? detectLocale());
if (!stored && typeof localStorage !== "undefined") {
  try {
    localStorage.setItem(LOCALE_KEY, locale.value);
  } catch {}
}

function setLocale(next: string) {
  const normalized = normalizeLocale(next) ?? "en";
  if (normalized === locale.value) return;
  locale.value = normalized;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(LOCALE_KEY, normalized);
    } catch {}
  }
}

function resolveMessage(obj: MessageMap, key: string): string | null {
  const parts = key.split(".");
  let current: string | MessageMap = obj;
  for (const part of parts) {
    if (typeof current === "string") return null;
    const next: string | MessageMap | undefined = current[part];
    if (next === undefined) return null;
    current = next;
  }
  return typeof current === "string" ? current : null;
}

function format(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

function t(key: string, params?: Record<string, string | number>) {
  const msg =
    resolveMessage(messages[locale.value], key) ??
    resolveMessage(messages.en, key) ??
    key;
  return format(msg, params);
}

function syncHtmlLang(next: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = next;
}

syncHtmlLang(locale.value);
watch(locale, (next) => syncHtmlLang(next));

export function useI18n() {
  return { t, locale, setLocale, localeOptions };
}

export { t, locale, setLocale };
