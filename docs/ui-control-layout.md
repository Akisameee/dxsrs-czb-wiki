# 横向控件布局需求与测试项

本文档记录工具页横向控件的布局约定。目标是用接近 Bootstrap `row / col / col-auto` 的思路实现一套轻量自定义样式，避免继续在不同页面各写一套。

## 布局目标

- 控件组使用统一结构：`control-row` -> `control-col` / `control-col-auto` -> `control-panel` -> `control-field` / `control-button`。
- `control-row` 负责横向排列多个面板，空间不够时允许换行。
- `control-col` 类似 Bootstrap 的 `.col`：自动占据剩余宽度。
- `control-col-auto` 类似 Bootstrap 的 `.col-auto`：只占自身内容需要的宽度。
- 同一行里多个面板都需要一起缩放时，不要使用 `control-col-auto`；都用 `control-col`，再用页面专属 class 设置 `flex` 比例。
- `control-panel` 是带边框和背景的控件块，内部控件横向排列。
- `control-field` 是一个“文字在上，输入框在下”的控件。
- `control-button` 固定宽度，不随容器宽度变化。
- 需要“输入框 + 按钮”保持同一行时，优先让操作面板使用两列布局，不要把字段宽度写死。

## 不要做的事

- 不要让 `control-panel` 通过横向滚动解决空间不足。
- 不要给普通列设置类似 `240px`、`360px` 的硬阈值来强制整块掉到下一行。
- 不要再引入中间层 `h-control-items` / `select-grid` / `h-control-item`。
- 不要让按钮被输入框挤压变形。
- 不要通过固定某个 `control-field` 宽度来修复按钮换行。
- 需要左右两个面板一起缩放时，不要把右侧面板写成 `control-col-auto`。
- 不要让同一个控件组在不同页面使用不同布局模型。

## 推荐模式

### 两个面板按比例共同缩放

适用于“左侧主控件 + 右侧操作区”这类布局。两个面板都使用 `control-col`，比例交给页面专属 class。

```html
<section class="control-row searcher-controls">
  <div class="control-col control-panel searcher-target-row">
    ...
  </div>
  <div class="control-col control-panel searcher-action-row">
    ...
  </div>
</section>
```

```css
.searcher-target-row {
  flex: 1 1 0;
}

.searcher-action-row {
  flex: 0.35 1 0;
}
```

这个模式下，左右两块会按 `1 : 0.35` 一起缩放。右侧不是内容固定宽，也不会在拖动分隔线时和左侧脱节。

### 内容宽度面板

只有在面板确实应该按内容宽度固定时，才使用 `control-col-auto`。

```html
<div class="control-col-auto control-panel">
  ...
</div>
```

不要把 `control-col-auto` 用在需要跟随相邻面板一起缩放的区域。

## 页面要求

### 自创武学模拟

- 初始四维和武器类型在同一个 `control-panel` 内。
- 初始输入区域占满左侧栏宽度。
- 宽度变窄时，四维和武器类型在面板内部自然折成多行。
- 模拟操作区域占满左侧栏宽度。
- 模拟次数输入框占据按钮之外的剩余宽度。
- 模拟按钮固定宽度，和输入框保持同一行。

### 自创武学初始搜索

- 搜索目标和搜索操作是同一个 `control-row` 下的两个面板。
- 搜索目标面板和搜索操作面板都使用 `control-col`，通过 `flex` 比例一起缩放。
- 当前比例为：搜索目标 `flex: 1 1 0`，搜索操作 `flex: 0.35 1 0`。
- 搜索操作面板内部必须保持一行：模拟次数输入框在左，搜索按钮在右。
- 搜索目标面板变窄时，内部字段自然折行，不出现横向滚动条。

### 武学配装额外词条

- 装备风格词条和自创外功是同一个 `control-row` 下的两个面板。
- 两个面板宽度随容器自动分配。
- 容器变窄时，面板内部控件自然折行。
- 不需要额外外框；外层只负责并排和间距。

## 手工测试项

1. 打开 `/tools/self-create/`。
2. 左侧“初始输入”区域应占满左侧栏宽度。
3. 拖动中间分隔线缩小左侧栏，四维和武器类型应在面板内部换行，不出现横向滚动条。
4. 左侧“模拟次数 + 模拟”区域应占满左侧栏宽度。
5. “模拟次数”输入框应拉伸填满按钮左侧的剩余空间。
6. “模拟”按钮应固定宽度，不变宽、不换行。
7. 右侧“搜索目标”面板和“搜索操作”面板应横向排列，并按比例一起缩放。
8. 缩小右侧栏时，“搜索目标”内部字段应换行，不出现横向滚动条。
9. “搜索操作”内部应始终保持“模拟次数 + 搜索”同一行。
10. “搜索”按钮应固定宽度，不变宽、不换行。
11. 打开 `/tools/loadout/`。
12. “装备风格词条”和“自创外功”应并排显示。
13. 拖动分隔线缩小左侧栏时，两个面板内部控件应自然换行。
14. 额外词条区域外层不应出现额外边框。
15. 页面任意位置不应因为这些控件出现横向页面滚动条。

## 自动检查

当前这些布局主要依赖视觉验收。每次修改后至少运行：

```powershell
node tests\self_create_regression.mjs
npm run build
```

如需后续自动化，可用 Playwright 增加截图断言：

- 桌面宽度：`1440px`
- 中等宽度：`960px`
- 窄栏场景：拖动分隔线到最小宽度后截图
- 断言页面 `document.documentElement.scrollWidth <= document.documentElement.clientWidth`
- 断言 `searcher-action-row` 内按钮和输入框在同一水平行
