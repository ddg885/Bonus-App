import { currency } from '../core/formatters.js';

export function barList(title, data) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const columns = data.map((d) => {
    const height = Math.max(2, (d.value / max) * 100);
    return `
      <div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;min-width:54px;flex:1 1 54px;">
        <div style="height:160px;display:flex;align-items:flex-end;width:100%;">
          <i style="display:block;width:100%;height:${height}%;border-radius:8px 8px 0 0;background:linear-gradient(180deg,#8aa4ff,#5f7ee8);"></i>
        </div>
        <span style="font-size:0.75rem;text-align:center;line-height:1.2;word-break:break-word;">${d.label}</span>
        <b style="font-size:0.75rem;">${currency(d.value)}</b>
      </div>
    `;
  }).join('');

  return `<section class="chart-panel"><h2>${title}</h2><div style="min-height:260px;display:flex;align-items:flex-end;gap:0.6rem;padding:0.4rem 0;overflow-x:auto;">${columns}</div></section>`;
}
