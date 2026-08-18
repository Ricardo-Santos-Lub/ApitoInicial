// Utilitário de UI compartilhado entre as telas.

export function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

// Rótulo padrão de jogador nas listas do app: número da camisa (modo manual) ou
// nível (modo sorteio), mais o marcador de goleiro quando aplicável.
export function rotuloJogador(jogador) {
  const goleiro = jogador.goleiro ? ' <span class="badge-goleiro" title="Goleiro">🧤</span>' : "";
  if (jogador.numero != null) return `<span class="badge-numero">${jogador.numero}</span> ${escapeHtml(jogador.nome)}${goleiro}`;
  if (jogador.nivel) return `${escapeHtml(jogador.nome)} <span class="nivel-tag">nível ${jogador.nivel}</span>${goleiro}`;
  return `${escapeHtml(jogador.nome)}${goleiro}`;
}
