# imgtopixel（ピクセル素材の正規化）

imgtopixel は、AI 生成の「ピクセル風」画像を実用的なピクセル素材に整えるための、ブラウザ上のノードワークフローツールです。背景除去、ピクセルブロック検出、目標グリッドへのピクセル化/再サンプリングを行います。AI ピクセルアート素材や、ゲームエンジン向けカットアウト/スライスアニメーション用 AI 素材の調整にも向いています。

言語ドキュメント:
- [English](../README.md)
- [中文](README.zh-CN.md)
- 日本語（このページ）

## 背景と課題

実運用では、AI 生成のピクセル風画像に次の問題がよくあります。

- ブロック境界が曖昧で、サイズやグリッドが揃っていない。
- 同じバッチ内でも画像サイズがばらばら。
- 一部の AI ツールには参照画像の最小サイズ要件がある（例: 512x512）。

## 目的

imgtopixel は、見た目だけピクセル風の画像を「編集しやすく、再利用しやすい素材」に変換することを目的としています。

- 背景を素早く除去する。
- 可能な限り実際のピクセルブロックサイズとオフセットを推定する。
- 目標グリッドサイズへ統一する。
- 複数画像をまとめて処理し、PNG で出力する。

## 現在の機能範囲

ノード:
- `Upload`
- `RemoveBg`（ローカル: 端の背景色推定 + BFS 拡張）
- `AiRemoveBg`（`@imgly/background-removal`）
- `Pixelate`（`Auto` / `Manual Size` / `Manual Target`）

実行時の挙動:
- 結果パネルでは終端ノード出力をプレビューし、画像ごとにダウンロード可能。

## クイックスタート

```bash
npm install
npm run dev
```

```bash
npm run lint
npm run build
```

## 典型的なワークフロー

- `Upload -> Pixelate(Auto)`：ブロック不整合の補正
- `Upload -> RemoveBg -> Pixelate(Manual Target 64x64)`：透過 + サイズ統一
- `Upload -> AiRemoveBg -> Pixelate(...)`：背景が複雑なケース

## CI と GitHub Pages

- `push main` / `pull_request` で `lint + build` を実行
- `push main` で GitHub Pages へ自動デプロイ
- リポジトリ設定の `Settings -> Pages -> Build and deployment -> Source` を `GitHub Actions` に設定

## 素材フォルダの推奨

- 開発用テスト素材: [`tests/samples/`](../tests/samples/README.md)
