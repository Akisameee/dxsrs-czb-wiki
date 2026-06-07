const NAV_ITEMS = [
  { key: "home", label: "首页", href: "index.html" },
  { key: "martial", label: "功法", href: "tools/loadout.html" },
  { key: "characters", label: "人物", href: null },
  { key: "events", label: "事件", href: null },
];

const TOOL_ITEMS = [
  { key: "loadout", label: "武学配装", href: "tools/loadout.html" },
  { key: "self-create", label: "自创模拟", href: "tools/self-create.html" },
];

function resolvePath(root, href) {
  if (!href) return "#";
  return `${root || ""}${href}`;
}

function renderNav() {
  const mount = document.querySelector("[data-site-nav]");
  if (!mount) return;

  const root = mount.dataset.navRoot || "";
  const active = mount.dataset.active || "";
  const navItems = NAV_ITEMS.map((item) => {
    const disabled = !item.href;
    const attrs = [
      `href="${resolvePath(root, item.href)}"`,
      item.key === active ? `class="is-active"` : "",
      disabled ? `aria-disabled="true"` : "",
    ].filter(Boolean).join(" ");
    return `<a ${attrs}>${item.label}</a>`;
  }).join("");

  const toolItems = TOOL_ITEMS.map((item) => {
    const activeClass = item.key === active ? ` class="is-active"` : "";
    return `<a href="${resolvePath(root, item.href)}"${activeClass}>${item.label}</a>`;
  }).join("");

  mount.outerHTML = `
    <nav class="site-nav" aria-label="主导航">
      ${navItems}
      <div class="nav-menu">
        <button class="${TOOL_ITEMS.some((item) => item.key === active) ? "is-active" : ""}" type="button" aria-expanded="false" aria-haspopup="true">工具</button>
        <div class="nav-dropdown" role="menu">
          ${toolItems}
        </div>
      </div>
    </nav>
  `;
}

renderNav();

const menu = document.querySelector(".nav-menu");
const button = menu?.querySelector("button");

function setMenuOpen(isOpen) {
  if (!menu || !button) return;
  menu.classList.toggle("is-open", isOpen);
  button.setAttribute("aria-expanded", String(isOpen));
}

button?.addEventListener("click", (event) => {
  event.stopPropagation();
  setMenuOpen(!menu.classList.contains("is-open"));
});

document.addEventListener("click", (event) => {
  if (!menu || menu.contains(event.target)) return;
  setMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  setMenuOpen(false);
  button?.focus();
});
