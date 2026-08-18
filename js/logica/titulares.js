// Regras puras de sorteio de titulares x reservas dentro de um time. Sem DOM.

import { embaralhar } from "./aleatorio.js";

export function sortearTitulares(jogadores, limite) {
  if (jogadores.length <= limite) {
    return jogadores.map((j) => ({ ...j, titular: true }));
  }

  // Goleiro entra como titular primeiro (até o limite), pra ninguém ficar de reserva
  // só por azar do sorteio e o time acabar sem goleiro em campo.
  const goleiros = jogadores.filter((j) => j.goleiro);
  const resto = jogadores.filter((j) => !j.goleiro);

  const idsTitulares = new Set(embaralhar(goleiros.map((j) => j.id)).slice(0, limite));
  const vagasRestantes = limite - idsTitulares.size;
  if (vagasRestantes > 0) {
    embaralhar(resto.map((j) => j.id))
      .slice(0, vagasRestantes)
      .forEach((id) => idsTitulares.add(id));
  }

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
