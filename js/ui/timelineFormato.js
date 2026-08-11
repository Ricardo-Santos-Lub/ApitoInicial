// Formatação de eventos compartilhada entre a tela de placar e a súmula final.

import { buscarJogador } from "../logica/eventos.js";

export const ICONE_EVENTO = {
  gol: "⚽",
  substituicao: "🔄"
};

export const ROTULO_TEMPO_CURTO = {
  "1_tempo": "1T",
  "2_tempo": "2T"
};

export function descreverEvento(partida, evento) {
  const time = partida.times[evento.timeId];
  if (evento.tipo === "substituicao") {
    const sai = buscarJogador(partida, evento.timeId, evento.jogadorSaiId);
    const entra = buscarJogador(partida, evento.timeId, evento.jogadorEntraId);
    return `${escapeHtml(sai?.nome ?? "?")} saiu, ${escapeHtml(entra?.nome ?? "?")} entrou <span class="timeline-time">(${escapeHtml(time.nome)})</span>`;
  }
  const jogador = buscarJogador(partida, evento.timeId, evento.jogadorId);
  return `${escapeHtml(jogador?.nome ?? "?")} <span class="timeline-time">(${escapeHtml(time.nome)})</span>`;
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
