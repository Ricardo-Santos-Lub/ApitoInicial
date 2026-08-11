// Regras puras de sorteio de times. Sem DOM.
//
// Estratégia: embaralha o pool (aleatoriedade entre jogadores de mesmo nível),
// ordena por nível decrescente e distribui cada jogador pro time com a menor
// soma de nível até o momento — resultado balanceado sem precisar de força bruta.
// Depois de dividir os times, sorteia dentro de cada um quem começa em campo
// (titular) e quem fica de reserva, respeitando o limite do formato.

import { embaralhar } from "./aleatorio.js";
import { sortearTitulares } from "./titulares.js";

export function sortearTimes(partida) {
  if (partida.poolJogadores.length < 2) return partida;

  const embaralhados = embaralhar(partida.poolJogadores);
  const ordenados = [...embaralhados].sort((a, b) => b.nivel - a.nivel);

  const casa = [];
  const visitante = [];
  let somaCasa = 0;
  let somaVisitante = 0;

  for (const jogador of ordenados) {
    if (somaCasa <= somaVisitante) {
      casa.push({ ...jogador, timeId: "casa" });
      somaCasa += jogador.nivel;
    } else {
      visitante.push({ ...jogador, timeId: "visitante" });
      somaVisitante += jogador.nivel;
    }
  }

  const limite = partida.formato.jogadoresPorTime;

  return {
    ...partida,
    times: {
      ...partida.times,
      casa: { ...partida.times.casa, jogadores: sortearTitulares(casa, limite) },
      visitante: { ...partida.times.visitante, jogadores: sortearTitulares(visitante, limite) }
    }
  };
}
