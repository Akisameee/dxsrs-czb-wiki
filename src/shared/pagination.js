const ACTION_ATTR = "data-pagination-action";

export function renderPagination({ page, pageCount, extraHtml = "" }) {
  const pageButtons = pageCount > 1
    ? `
      <button type="button" ${ACTION_ATTR}="first" ${page <= 1 ? "disabled" : ""} aria-label="首页">&lt;&lt;</button>
      <button type="button" ${ACTION_ATTR}="prev" ${page <= 1 ? "disabled" : ""} aria-label="上一页">&lt;</button>
      <span>第 ${page} / ${pageCount} 页</span>
      <button type="button" ${ACTION_ATTR}="next" ${page >= pageCount ? "disabled" : ""} aria-label="下一页">&gt;</button>
      <button type="button" ${ACTION_ATTR}="last" ${page >= pageCount ? "disabled" : ""} aria-label="末页">&gt;&gt;</button>
    `
    : "";
  if (!pageButtons && !extraHtml) return "";
  return `
    <div class="pagination" aria-label="分页">
      ${pageButtons}
      ${extraHtml}
    </div>
  `;
}

export function getPaginationAction(event) {
  return event.target.closest(`[${ACTION_ATTR}]`)?.dataset.paginationAction || null;
}

export function pageFromPaginationAction(action, page, pageCount) {
  if (action === "first") return 1;
  if (action === "prev") return page - 1;
  if (action === "next") return page + 1;
  if (action === "last") return pageCount;
  return page;
}
