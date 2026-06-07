# 大侠式人生重制版资料站

静态资料站和工具页。当前先保留原生 HTML/CSS/JS 结构，方便继续快速迭代；后续如果要做成完整 wiki，可以迁移到 Astro 或其他静态站框架。

## 目录

- `index.html`：站点首页。
- `tools/`：工具页面。
  - `loadout.html`：武学配装模拟器。
  - `self-create.html`：自创武功模拟器。
- `src/`：前端逻辑。
  - `app/`：共享站点模块，例如导航。
  - `shared/`：跨工具复用的常量和通用函数。
  - `tools/loadout/`：武学配装工具逻辑。
  - `tools/self-create/`：自创模拟器和 Unity 随机数复现。
- `data/`：前端直接读取的数据。
- `data/raw/`：从游戏数据库解析出的原始表。
- `scripts/`：数据解析和构建脚本。

## 本地运行

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

打开：

```text
http://127.0.0.1:8000/
```

## 逆向资料

`dump/`、`jadx/`、`Cpp2IL-*.exe` 属于本地研究材料，不是网站部署内容，已加入 `.gitignore`。
