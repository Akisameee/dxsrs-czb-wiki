import { registeredPages } from "./page-registry.js";

const input = document.getElementById("global-search-input");
const results = document.getElementById("global-search-results");

let pagesPromise = null;
let activeIndex = -1;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function loadPages() {
  if (!pagesPromise) pagesPromise = registeredPages();
  return pagesPromise;
}

function scoreTitle(title, query) {
  const normalizedTitle = normalize(title);
  const normalizedQuery = normalize(query);
  if (!normalizedQuery || !normalizedTitle.includes(normalizedQuery)) return 0;
  if (normalizedTitle === normalizedQuery) return 100;
  if (normalizedTitle.startsWith(normalizedQuery)) return 70;
  return 30;
}

function hideResults() {
  if (!results) return;
  results.hidden = true;
  results.innerHTML = "";
  activeIndex = -1;
}

function setActive(nextIndex) {
  const items = [...results.querySelectorAll("[data-global-search-result]")];
  activeIndex = Math.max(-1, Math.min(nextIndex, items.length - 1));
  items.forEach((item, index) => item.classList.toggle("is-active", index === activeIndex));
  if (activeIndex >= 0) items[activeIndex].scrollIntoView({ block: "nearest" });
}

function renderMatches(matches, query) {
  if (!results) return;
  if (!query) {
    hideResults();
    return;
  }

  results.hidden = false;
  if (!matches.length) {
    results.innerHTML = `<div class="nav-search-empty">没有匹配标题</div>`;
    activeIndex = -1;
    return;
  }

  results.innerHTML = matches.slice(0, 12).map((page) => `
    <a href="${escapeHtml(page.href)}" data-global-search-result>
      <span>${escapeHtml(page.type)}</span>
      <strong>${escapeHtml(page.title)}</strong>
    </a>
  `).join("");
  setActive(-1);
}

async function search() {
  const query = input.value.trim();
  if (!query) {
    hideResults();
    return;
  }

  results.hidden = false;
  results.innerHTML = `<div class="nav-search-empty">搜索中...</div>`;

  try {
    const pages = await loadPages();
    const matches = pages
      .map((page) => ({ ...page, score: scoreTitle(page.title, query) }))
      .filter((page) => page.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "zh-Hans-CN"));
    renderMatches(matches, query);
  } catch (error) {
    results.innerHTML = `<div class="nav-search-empty">搜索索引读取失败：${escapeHtml(error.message)}</div>`;
  }
}

if (input && results) {
  input.addEventListener("focus", () => {
    if (input.value.trim()) search();
    else loadPages().catch(() => {});
  });
  input.addEventListener("input", search);
  input.addEventListener("keydown", (event) => {
    const items = [...results.querySelectorAll("[data-global-search-result]")];
    if (event.key === "Escape") {
      hideResults();
      input.blur();
      return;
    }
    if (!items.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(activeIndex + 1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(activeIndex <= 0 ? items.length - 1 : activeIndex - 1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      window.location.href = items[Math.max(activeIndex, 0)].href;
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(".nav-search")) return;
    hideResults();
  });
}
