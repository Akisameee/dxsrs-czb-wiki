const STORAGE_PREFIX = "dxsrs.split.";
const BREAKPOINT = 960;

function numberAttr(element, name, fallback) {
  const value = Number(element.dataset[name]);
  return Number.isFinite(value) ? value : fallback;
}

function storageKey(split) {
  return `${STORAGE_PREFIX}${split.dataset.splitId || "default"}`;
}

function innerMetrics(split) {
  const rect = split.getBoundingClientRect();
  const style = window.getComputedStyle(split);
  const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
  const paddingRight = Number.parseFloat(style.paddingRight) || 0;
  return {
    left: rect.left + paddingLeft,
    width: split.clientWidth - paddingLeft - paddingRight,
  };
}

function dividerWidth(split) {
  const divider = split.querySelector("[data-split-resizer]");
  return divider?.offsetWidth || 16;
}

function clampLeftWidth(split, width) {
  const minLeft = numberAttr(split, "splitMinLeft", 280);
  const minRight = numberAttr(split, "splitMinRight", 280);
  const max = innerMetrics(split).width - dividerWidth(split) - minRight;
  return Math.max(minLeft, Math.min(width, max));
}

function applyLeftWidth(split, width, persist = true) {
  if (window.innerWidth <= BREAKPOINT) return;
  const clamped = clampLeftWidth(split, width);
  split.style.setProperty("--split-left", `${clamped}px`);
  if (persist) localStorage.setItem(storageKey(split), String(clamped));
}

function applyDefault(split) {
  const metrics = innerMetrics(split);
  const percent = numberAttr(split, "splitDefault", 50);
  applyLeftWidth(split, metrics.width * (percent / 100), false);
}

function restoreSplit(split) {
  const saved = Number(localStorage.getItem(storageKey(split)));
  if (Number.isFinite(saved) && saved > 0) {
    applyLeftWidth(split, saved, false);
    return;
  }
  applyDefault(split);
}

function attachSplit(split) {
  const divider = split.querySelector("[data-split-resizer]");
  if (!divider) return;

  restoreSplit(split);

  divider.addEventListener("pointerdown", (event) => {
    if (window.innerWidth <= BREAKPOINT) return;
    event.preventDefault();
    divider.setPointerCapture(event.pointerId);
    document.body.classList.add("is-resizing-split");
    split.classList.add("is-resizing");
  });

  divider.addEventListener("pointermove", (event) => {
    if (!divider.hasPointerCapture(event.pointerId)) return;
    const metrics = innerMetrics(split);
    applyLeftWidth(split, event.clientX - metrics.left);
  });

  function finishResize(event) {
    if (divider.hasPointerCapture(event.pointerId)) {
      divider.releasePointerCapture(event.pointerId);
    }
    document.body.classList.remove("is-resizing-split");
    split.classList.remove("is-resizing");
  }

  divider.addEventListener("pointerup", finishResize);
  divider.addEventListener("pointercancel", finishResize);
  divider.addEventListener("dblclick", () => {
    localStorage.removeItem(storageKey(split));
    applyDefault(split);
  });

  divider.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const current = Number.parseFloat(getComputedStyle(split).getPropertyValue("--split-left")) || innerMetrics(split).width / 2;
    applyLeftWidth(split, current + (event.key === "ArrowRight" ? 24 : -24));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth <= BREAKPOINT) return;
    const current = Number.parseFloat(getComputedStyle(split).getPropertyValue("--split-left"));
    if (Number.isFinite(current)) applyLeftWidth(split, current, false);
    else restoreSplit(split);
  });
}

document.querySelectorAll(".resizable-split").forEach(attachSplit);
