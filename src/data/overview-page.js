import { getPaginationAction, pageFromPaginationAction, renderPagination } from "../shared/pagination.js";
import { queryRows } from "../shared/wiki-db.js";

const PAGE_SIZE = 50;

const state = {
  tables: [],
  table: "",
  columns: [],
  rows: [],
  filteredRows: [],
  page: 1,
};

const els = {
  status: document.getElementById("data-overview-status"),
  tableSelect: document.getElementById("data-table-select"),
  search: document.getElementById("data-table-search"),
  count: document.getElementById("data-table-count"),
  pager: document.getElementById("data-table-pager"),
  head: document.getElementById("data-table-head"),
  body: document.getElementById("data-table-body"),
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function formatCell(value) {
  if (value === null) return '<span class="data-null">NULL</span>';
  if (value === undefined) return "";
  return escapeHtml(value);
}

function setStatus(text) {
  if (els.status) els.status.textContent = text;
}

function renderTableSelect() {
  els.tableSelect.innerHTML = state.tables
    .map((table) => `<option value="${escapeHtml(table)}">${escapeHtml(table)}</option>`)
    .join("");
  els.tableSelect.value = state.table;
}

function applySearch() {
  const keyword = els.search.value.trim().toLowerCase();
  state.filteredRows = keyword
    ? state.rows.filter((row) => state.columns.some((column) => String(row[column] ?? "").toLowerCase().includes(keyword)))
    : state.rows;
  state.page = 1;
  renderRows();
}

function renderRows() {
  const pageCount = Math.max(1, Math.ceil(state.filteredRows.length / PAGE_SIZE));
  state.page = Math.min(Math.max(state.page, 1), pageCount);
  const offset = (state.page - 1) * PAGE_SIZE;
  const pageRows = state.filteredRows.slice(offset, offset + PAGE_SIZE);

  els.count.textContent = `${state.table || "未选择表"}：${state.filteredRows.length} 行 / ${state.columns.length} 字段`;
  els.pager.innerHTML = renderPagination({ page: state.page, pageCount });
  els.head.innerHTML = `
    <tr>
      ${state.columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join("")}
    </tr>
  `;
  els.body.innerHTML = pageRows.length
    ? pageRows.map((row) => `
      <tr>
        ${state.columns.map((column) => `<td>${formatCell(row[column])}</td>`).join("")}
      </tr>
    `).join("")
    : `<tr><td colspan="${Math.max(state.columns.length, 1)}">没有匹配的数据</td></tr>`;
}

async function loadTable(table) {
  state.table = table;
  state.page = 1;
  els.search.value = "";
  setStatus(`正在读取 ${table}...`);

  const quotedTable = quoteIdentifier(table);
  const [columnRows, rows] = await Promise.all([
    queryRows(`PRAGMA table_info(${quotedTable})`),
    queryRows(`SELECT * FROM ${quotedTable}`),
  ]);

  state.columns = columnRows.map((row) => row.name);
  state.rows = rows;
  state.filteredRows = rows;
  renderRows();
  setStatus(`当前表：${table}`);
}

async function init() {
  try {
    state.tables = (await queryRows(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)).map((row) => row.name);

    if (state.tables.length === 0) {
      els.count.textContent = "wiki.sqlite 里没有可展示的表";
      setStatus("没有读取到表。");
      return;
    }

    state.table = state.tables[0];
    renderTableSelect();
    await loadTable(state.table);
  } catch (error) {
    console.error(error);
    els.count.textContent = "读取失败";
    setStatus(error.message || "wiki.sqlite 读取失败。");
  }
}

els.tableSelect?.addEventListener("change", () => {
  loadTable(els.tableSelect.value);
});

els.search?.addEventListener("input", applySearch);

els.pager?.addEventListener("click", (event) => {
  const action = getPaginationAction(event);
  if (!action) return;
  const pageCount = Math.max(1, Math.ceil(state.filteredRows.length / PAGE_SIZE));
  state.page = pageFromPaginationAction(action, state.page, pageCount);
  renderRows();
});

init();
