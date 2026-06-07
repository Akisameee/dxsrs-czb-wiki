# 大侠式人生重制版资料站

Astro 静态资料站和工具页。当前以资料页为主，工具逻辑仍保留原生浏览器 JS，方便继续快速迭代。

## 目录

- `src/pages/`：Astro 页面入口。
  - `index.astro`：站点首页。
  - `tools/loadout.astro`：武学配装模拟器。
  - `tools/self-create.astro`：自创武功模拟器。
- `src/components/`：共享页面组件，例如导航。
- `src/layouts/`：页面布局。
- `src/styles/`：全局样式。
- `src/shared/`：跨工具复用的常量和通用函数。
- `src/tools/`：前端工具逻辑。
  - `loadout/`：武学配装工具逻辑。
  - `self-create/`：自创模拟器和 Unity 随机数复现。
- `public/data/`：前端直接读取的数据，脚本也直接生成到这里。
  - `enums.json`：统一枚举表，前端用它把 id 显示成中文。
  - `martial_arts.json`、`sect_chains.json`、`style_chains.json`：展示数据尽量存 id，例如 `sectId`、`styleIds`、`typeId`、`effect.id`。
- `public/data/self_create.json`：自创模拟器使用的精简数据。
- `re/`：本地逆向资料目录，不上传。
  - `re/raw/`：从游戏数据库解析出的原始表，本地研究和重新生成数据用。
  - `re/dump/`、`re/jadx/`、`re/.tools/`：反编译和分析工具产物。
- `scripts/`：数据解析和构建脚本。

## 本地运行

```powershell
npm install
npm run dev
```

默认配置带 GitHub Pages 子路径，开发地址通常是：

```text
http://localhost:4321/dxsrs-czb-wiki/
```

构建：

```powershell
npm run build
```

生成结果在 `dist/`。

如果刚从原始表重新生成前端数据：

```powershell
npm run build:data
```

## 逆向资料

`re/`、`Cpp2IL-*.exe` 属于本地研究材料，不是网站部署内容，已加入 `.gitignore`。前端只读取 `public/data/` 里的精简数据，不直接读取原始表。
