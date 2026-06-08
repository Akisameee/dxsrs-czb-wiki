import { escapeHtml } from "./utils.js";

function attrsToHtml(attrs = {}) {
  return Object.entries(attrs)
    .filter(([, value]) => value !== null && value !== undefined && value !== false)
    .map(([name, value]) => value === true
      ? name
      : `${name}="${escapeHtml(value)}"`)
    .join(" ");
}

export function renderWikiCard(options) {
  const {
    href = "",
    title,
    subtitle = "",
    tags = "",
    className = "",
    titleAttr = "",
    dataAttrs = {},
    disabled = false,
    selected = false,
    info = null,
    showCheckMark = false,
  } = options;
  const classes = [
    "wiki-card",
    href ? "wiki-card-link" : "",
    className,
    selected ? "is-selected" : "",
    disabled ? "is-disabled" : "",
  ].filter(Boolean).join(" ");
  const infoButton = info ? `
    <span
      class="wiki-info-button"
      ${info.attr}="${escapeHtml(info.value)}"
      aria-label="${escapeHtml(info.label)}"
    >?</span>
  ` : "";
  const actions = infoButton || showCheckMark ? `
    <span class="wiki-card-title-actions">
      ${infoButton}
      ${showCheckMark ? `<span class="check-mark" aria-hidden="true">✓</span>` : ""}
    </span>
  ` : "";
  const body = `
    <span class="wiki-card-title">
      <span>${escapeHtml(title)}</span>
      ${actions}
    </span>
    ${subtitle ? `<span class="wiki-card-subtitle">${escapeHtml(subtitle)}</span>` : ""}
    <span class="tag-row">${tags}</span>
  `;

  if (href) {
    return `
      <a class="${classes}" href="${escapeHtml(href)}">
        ${body}
      </a>
    `;
  }

  return `
    <button
      type="button"
      class="${classes}"
      ${attrsToHtml(dataAttrs)}
      ${titleAttr ? `title="${escapeHtml(titleAttr)}"` : ""}
      ${disabled ? "aria-disabled=\"true\"" : ""}
    >
      ${body}
    </button>
  `;
}
