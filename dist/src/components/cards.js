import { currency, number } from '../core/formatters.js';

export function metricCards(cards) {
  return `<section class="cards">${cards.map((c) => `<article class="card"><h3>${c.label}</h3><p>${c.currency ? currency(c.value) : number(c.value)}</p></article>`).join('')}</section>`;
}
