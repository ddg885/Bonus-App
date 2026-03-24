import { currency } from '../core/formatters.js';

export function barList(title, data) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return `<section class="chart-panel"><h2>${title}</h2>${data.map((d) => `<div class="bar-row"><span>${d.label}</span><div class="bar"><i style="width:${(d.value / max) * 100}%"></i></div><b>${currency(d.value)}</b></div>`).join('')}</section>`;
}
