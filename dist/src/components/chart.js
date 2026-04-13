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

export function stackedColumnChart(title, columns) {
  const maxTotal = Math.max(1, ...columns.map((column) => column.segments.reduce((sum, segment) => sum + Number(segment.value || 0), 0)));
  const renderedColumns = columns.map((column) => {
    const total = column.segments.reduce((sum, segment) => sum + Number(segment.value || 0), 0);
    const renderedSegments = column.segments.map((segment) => {
      const value = Number(segment.value || 0);
      const percentOfTotal = total > 0 ? (value / total) * 100 : 0;
      const height = total > 0 ? `${percentOfTotal}%` : '0';
      return `<div class="stacked-column-segment ${segment.tone || ''}" style="height:${height};" title="${segment.label}: ${currency(value)}"><span>${segment.label}</span></div>`;
    }).join('');

    return `
      <div class="stacked-column-item">
        <div class="stacked-column-wrap">
          <div class="stacked-column" style="height:${Math.max(2, (total / maxTotal) * 100)}%;">
            ${renderedSegments}
          </div>
        </div>
        <strong class="stacked-column-total">${currency(total)}</strong>
        <span class="stacked-column-label">${column.label}</span>
      </div>
    `;
  }).join('');

  return `
    <section class="chart-panel">
      <h2>${title}</h2>
      <div class="stacked-column-grid">${renderedColumns}</div>
      <div class="stacked-column-legend">
        <span><i class="stacked-column-swatch approved"></i>Approved</span>
        <span><i class="stacked-column-swatch committed"></i>Committed</span>
      </div>
    </section>
  `;
}
