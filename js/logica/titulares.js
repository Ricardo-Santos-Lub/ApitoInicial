// Regras puras de sorteio de titulares x reservas dentro de um time. Sem DOM.

import { embaralhar } from "./aleatorio.js";

export function sortearTitulares(jogadores, limite) {
  if (jogadores.length <= limite) {
    return jogadores.map((j) => ({ ...j, titular: true }));
  }
  const idsEmbaralhados = embaralhar(jogadores.map((j) => j.id));
  const idsTitulares = new Set(idsEmbaralhados.slice(0, limite));
  return jogadores.map((j) => ({ ...j, titular: idsTitulares.has(j.id) }));
}

export function sortearTitularesTime(partida, timeId) {
  const limite = partida.formato.jogadoresPorTime;
  return {
    ...partida,
    times: {
      ...partida.times,
      [timeId]: {
        ...partida.times[timeId],
        jogadores: sortearTitulares(partida.times[timeId].jogadores, limite)
      }
    }
  };
}
