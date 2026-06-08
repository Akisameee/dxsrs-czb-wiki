import { escapeHtml } from "../../shared/utils.js";
import { hideTooltip, hoverTooltip, positionTooltip, showTooltipContent } from "../../shared/hover-tooltip.js";

export { hideTooltip, hoverTooltip, positionTooltip };

export function showChainTooltip(effect, event) {
  showTooltipContent(`
    <header>
      <strong>连锁效果</strong>
    </header>
    <div class="tooltip-text">${escapeHtml(effect)}</div>
  `, event);
}
