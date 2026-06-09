## Vue shadcn-vue 开发准则

这份准则关注代码架构、代码风格、文件组织和组件组合方式。shadcn-vue 的核心不是引入一个黑盒 UI 库，而是把组件源码放进项目，再用这些组件组合业务界面。

### 架构原则

- 优先组合 shadcn-vue 组件，不要先设计一套自己的 UI 框架。
- `components/ui/*` 只放 shadcn-vue CLI 生成的基础组件。
- 不要手写或搬运 `components/ui/*` 里的组件；需要新组件时用 CLI 添加。
- 业务组件可以存在，但它们应当是 shadcn 组件的组合，而不是新的视觉体系。
- 页面先直接组合组件；只有结构重复、状态逻辑复杂或交互流程成型后，再抽业务组件。
- 抽象应服务于业务和交互复用，不要为了“统一”提前制造 wrapper。

### 文件组织

推荐分层：

- `components/ui/*`：shadcn-vue 基础组件，生成后尽量不改。
- `components/*`：跨页面业务组件，例如导航、页面头、数据表、筛选栏。
- `pages/*`：路由页面，负责组织数据读取、页面状态和主要布局。
- `composables/*`：可复用状态、数据加载、客户端能力封装。
- `lib/*`：纯函数、算法、格式化、数据转换和常量。

组件命名建议：

- 基础 UI 使用 shadcn-vue 原组件名，例如 `Button`、`Card`、`Table`。
- 业务组合组件使用清晰名词，例如 `AppSidebar`、`SiteHeader`、`DataTable`、`SearchFilters`。
- 避免抽象名过宽的组件，例如 `AppSection`、`WikiBlock`、`CommonPanel`，除非它真的承载明确语义。

### 代码风格

- Vue 文件优先使用 `<script setup lang="ts">`。
- 页面模板直接呈现结构，不把简单的一层 `Card` 或 `Table` 包成组件。
- 复杂逻辑放进 `computed`、`composables` 或 `lib`，不要塞满模板。
- 数据转换尽量在脚本区完成，模板里只做轻量展示。
- Tailwind utility 可以用于布局和间距；不要写独立 CSS 类去复刻旧样式。
- 不要把视觉颜色、边框、阴影等样式重复写在业务页面里，优先使用 shadcn 组件的 `variant` 和默认样式。

### 组件组合

常见组合方式：

- 页面入口：`Card + CardHeader + CardContent + Button`
- 数据索引：`Card + Input + Table + Badge + Button`
- 详情展示：`Card + Separator + Table/Badge`
- 多模式工具：`Tabs + Card + Form + Button`
- 复杂筛选：`Popover + Command + Checkbox/Select`
- 轻量提示：`Tooltip`
- 结构化悬浮信息：`HoverCard`
- 确认操作：`AlertDialog`
- 表单弹窗：`Dialog + Form`
- 侧边详情或移动端抽屉：`Sheet` 或 `Drawer`
- 长内容分组：`Accordion` 或 `Tabs`
- 加载状态：`Skeleton` 或 `Spinner`
- 空状态：`Empty`
- 通知反馈：`Sonner` 或 `Toast`

### 页面类型

首页和入口页：

- 保持轻量，用 `Card` 展示入口。
- 不要为了首页单独创建营销式 hero，除非产品真的需要。
- 入口卡片只放标题、短描述和动作按钮。

列表和索引页：

- 优先使用 `Table`，因为数据索引需要扫描、比较和操作。
- 搜索放在表格上方的 `Card` 或工具栏里。
- 少量筛选用 `Select`，多条件筛选用 `Popover` 或专门的筛选栏。
- 分页用 `Pagination`。
- 排序、列显隐、批量选择、复杂状态管理用 `DataTable` 模式。

详情页：

- 标题和摘要放在 `CardHeader`。
- 关键字段用 `Table` 或简洁的字段组。
- 标签和枚举值用 `Badge`。
- 长说明、任务阶段、关联条目等可折叠内容用 `Accordion` 或 `Tabs`。
- 详情页内容过多时分多个 `Card`，不要在一个卡片里堆所有东西。

工具页：

- 输入区和结果区分开。
- 多种运行模式用 `Tabs`。
- 输入控件使用 `Form / Field / Input / Select / Checkbox / Slider / NumberField`。
- 运行结果用 `Card + Table/Badge`。
- 异步运行需要明确的加载、错误和空状态。

导航框架：

- 顶部导航用 `NavigationMenu`。
- 信息架构复杂时用 `Sidebar`。
- 层级路径用 `Breadcrumb`。
- 下拉操作用 `DropdownMenu`。
- 不要手写浮层、菜单和键盘交互，优先使用 shadcn-vue 对应组件。

### 抽象时机

先写在页面里：

- 只有一个页面使用。
- 只是简单 `Card`、`Button`、`Table` 组合。
- 业务规则还没稳定。

可以抽业务组件：

- 同一结构出现三次以上。
- 组件内部有独立状态或复杂交互。
- 组件有明确业务语义，例如筛选栏、数据表、导航栏。
- 抽出来能减少页面认知负担，而不是只减少几行模板。

不要抽：

- 只是给 shadcn 组件改个 class。
- 只是把 `Card` 包一层。
- 名称无法表达清楚用途。
- 抽象后还需要大量 props 才能适配每个页面。

### 选择经验

- 能用 `Table` 就不要用卡片墙，除非内容本身更适合浏览而不是比较。
- 选项少用 `Select`，选项多且需要搜索用 `Command` 或 `Combobox`。
- 短提示用 `Tooltip`，多字段提示用 `HoverCard`。
- 临时编辑用 `Dialog`，大块详情用新页面或 `Sheet`。
- 少量分组用 `Accordion`，互斥视图用 `Tabs`。
- 重要破坏性操作用 `AlertDialog`，不要只用普通 `Dialog`。
