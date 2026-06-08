export const hoverTooltip = document.createElement("div");
hoverTooltip.className = "martial-tooltip";
hoverTooltip.setAttribute("role", "tooltip");
document.body.appendChild(hoverTooltip);

let hideTimer = null;

function cancelHideTooltip() {
  if (!hideTimer) return;
  window.clearTimeout(hideTimer);
  hideTimer = null;
}

export function positionTooltip(event) {
  positionTooltipAt(event.clientX, event.clientY);
}

export function positionTooltipAt(clientX, clientY) {
  const padding = 14;
  const gap = 12;
  const rect = hoverTooltip.getBoundingClientRect();
  let left = clientX + gap;
  let top = clientY + gap;

  if (left + rect.width + padding > window.innerWidth) {
    left = clientX - rect.width - gap;
  }
  if (top + rect.height + padding > window.innerHeight) {
    top = clientY - rect.height - gap;
  }

  hoverTooltip.style.left = `${Math.max(padding, left)}px`;
  hoverTooltip.style.top = `${Math.max(padding, top)}px`;
}

export function showTooltipContent(html, event) {
  cancelHideTooltip();
  hoverTooltip.innerHTML = html;
  hoverTooltip.classList.add("is-visible");
  positionTooltip(event);
}

export function hideTooltip(delay = 80) {
  cancelHideTooltip();
  hideTimer = window.setTimeout(() => {
    hoverTooltip.classList.remove("is-visible");
    hideTimer = null;
  }, delay);
}

hoverTooltip.addEventListener("mouseenter", cancelHideTooltip);
hoverTooltip.addEventListener("mouseleave", () => hideTooltip(0));
