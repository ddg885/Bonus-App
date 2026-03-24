import { currency, number } from '../core/formatters.js';

function toneClass(tone = 'primary') {
  if (tone === 'positive' || tone === 'warning' || tone === 'negative') return tone;
  return '';
}

export function statusBadge(label, tone = 'warning') {
  return `<span class="badge ${toneClass(tone)}">${label}</span>`;
}

export function metricCards(cards) {
  return `<section class="card-grid">${cards.map((c) => `<article class="metric-card ${toneClass(c.tone)}"><h3 class="metric-title">${c.label}</h3><p class="metric-value">${c.currency ? currency(c.value) : number(c.value)}</p>${c.subtitle ? `<div class="metric-subtitle">${c.subtitle}</div>` : ''}</article>`).join('')}</section>`;
}
