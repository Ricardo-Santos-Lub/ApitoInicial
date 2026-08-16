// Ícones SVG inline reutilizados pela UI. Sem dependência externa (funciona offline).
// Todos usam stroke="currentColor" pra herdar a cor do texto do elemento pai.

function svg(paths, viewBox = "0 0 24 24") {
  return `<svg class="icone" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

export const iconeVoltar = svg('<path d="M15 18l-6-6 6-6"/>');

export const iconeEstatisticas = svg(
  '<path d="M4 20V10"/><path d="M12 20V4"/><path d="M20 20v-7"/>'
);

export const iconeEditar = svg(
  '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>'
);

export const iconeInicio = svg(
  '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'
);
