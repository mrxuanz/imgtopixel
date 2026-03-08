# imgtopixel（像素素材规范化）

🚀 **[在线体验 Demo](http://pixel.neverenddream.top)**

一个浏览器端的节点式工作流工具，用来把 AI 生成的“像素风”素材规范化：去背景、识别像素块、按目标网格像素化/重采样，得到更适合编辑和复用的结果。适用于 AI 像素艺术素材，以及游戏引擎剪纸/切片动画的 AI 素材调整。

语言文档：
- [English](../README.md)
- 中文（本页）
- [日本語](README.ja.md)

## 演示 (Demo)

![Workflow demo](images/readme/workflow-demo.gif)

## 背景与痛点

在实际生产中，AI 生成的“像素风”素材常见问题：

- 像素块边界不清晰、块大小不一致、网格偏移。
- 一批素材尺寸不统一，难以统一到 32×32 / 64×64 等规格。
- 部分 AI 工具上传参考图有最小宽高门槛（例如 512×512）。

## 项目目标

imgtopixel 重点解决“像素网格规范化”问题：

- 快速去背景。
- 尽量自动推断真实像素块大小与偏移。
- 统一到指定目标网格尺寸。
- 支持批量处理与导出 PNG。

## 当前能力范围

工作流节点：
- `Upload`
- `RemoveBg`（本地：边缘背景色估计 + BFS 扩散）
- `AiRemoveBg`（`@imgly/background-removal`）
- `Pixelate`（`Auto` / `Manual Size` / `Manual Target`）
- `Sprite`（自动从背景中提取多个独立的子部件/精灵图）

执行行为：
- 结果面板预览末端节点输出，可逐张下载。

## 快速开始

```bash
npm install
npm run dev
```

```bash
npm run lint
npm run build
```

## 典型工作流

- `Upload -> Pixelate(Auto)`：修正像素块不一致问题。
- `Upload -> RemoveBg -> Pixelate(Manual Target 64x64)`：得到透明且统一尺寸素材。
- `Upload -> AiRemoveBg -> Pixelate(...)`：复杂背景场景。

## CI 与 GitHub Pages

- `push main` / `pull_request` 自动执行 `lint + build`。
- `push main` 自动部署 GitHub Pages。
- 仓库设置中将 `Settings -> Pages -> Build and deployment -> Source` 设为 `GitHub Actions`。

## 素材目录建议

- 开发调试测试素材：[`tests/samples/`](../tests/samples/README.md)
