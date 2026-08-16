// Regras puras de sorteio de times. Sem DOM.
//
// Estratégia: embaralha o pool (aleatoriedade entre jogadores de mesmo nível),
// ordena por nível decrescente e distribui cada jogador pro time com a menor
// soma de nível até o momento — resultado balanceado sem precisar de força bruta.
// Depois de dividir os times, sorteia dentro de cada um quem começa em campo
// (titular) e quem fica de reserva, respeitando o limite do formato.
//
// Se o pool for grande o bastante pra formar 3+ times de `jogadoresPorTime`
// jogadores, os 2 primeiros entram em campo (casa/visitante) e o resto vira
// fila de reserva (ver logica/rodizio.js pra regra de substituição). Com pool
// pequeno, cai no sorteio simples de sempre: só 2 times, sem fila.

import { embaralhar } from "./aleatorio.js";
import { sortearTitulares } from "./titulares.js";

const CORES_RESERVA = ["#8e24aa", "#fb8c00", "#00897b", "#5e35b1", "#d81b60", "#3949ab"];

export function sortearTimes(partida) {
  if (partida.poolJogadores.length < 2) return partida;

  const embaralhados = embaralhar(partida.poolJogadores);
  const ordenados = [...embaralhados].sort((a, b) => b.nivel - a.nivel);
  const limite = partida.formato.jogadoresPorTime;
  const numTimesCompletos = Math.floor(ordenados.length / limite);

  if (numTimesCompletos < 2) {
    return sortearDoisTimes(partida, ordenados, limite);
  }
  return sortearComFilaReserva(partida, ordenados, limite, numTimesCompletos);
}

function sortearDoisTimes(partida, ordenados, limite) {
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

  return {
    ...partida,
    filaReserva: [],
    times: {
      ...partida.times,
      casa: { ...partida.times.casa, jogadores: sortearTitulares(casa, limite) },
      visitante: { ...partida.times.visitante, jogadores: sortearTitulares(visitante, limite) }
    }
  };
}

function sortearComFilaReserva(partida, ordenados, limite, numTimes) {
  const buckets = distribuirEmTimes(ordenados, numTimes, limite);

  const timesFormados = buckets.map((jogadores, indice) => {
    if (indice === 0) return sortearTitulares(jogadores.map((j) => ({ ...j, timeId: "casa" })), limite);
    if (indice === 1) return sortearTitulares(jogadores.map((j) => ({ ...j, timeId: "visitante" })), limite);
    return sortearTitulares(jogadores, limite);
  });

  let proximoTimeReservaId = partida.proximoTimeReservaId;
  const filaReserva = timesFormados.slice(2).map((jogadores, indice) => {
    const time = {
      id: proximoTimeReservaId,
      nome: `Time ${indice + 3}`,
      cor: CORES_RESERVA[indice % CORES_RESERVA.length],
      jogadores
    };
    proximoTimeReservaId += 1;
    return time;
  });

  return {
    ...partida,
    proximoTimeReservaId,
    filaReserva,
    times: {
      ...partida.times,
      casa: { ...partida.times.casa, jogadores: timesFormados[0] },
      visitante: { ...partida.times.visitante, jogadores: timesFormados[1] }
    }
  };
}

// Distribui `ordenados` em `numTimes` grupos de até `limitePorTime` jogadores,
// sempre no grupo de menor soma de nível — mesma ideia do sorteio de 2 times,
// generalizada. Jogadores que sobram (pool não é múltiplo exato de `limitePorTime`)
// viram reserva extra: 1 a mais por grupo, também priorizando o de menor soma
// (sortearTitulares depois marca esse excedente como reserva dentro do time).
function distribuirEmTimes(ordenados, numTimes, limitePorTime) {
  const grupos = Array.from({ length: numTimes }, () => ({ jogadores: [], soma: 0 }));

  const comVaga = () => grupos.filter((g) => g.jogadores.length < limitePorTime);
  const menorSoma = (lista) => lista.reduce((menor, atual) => (atual.soma < menor.soma ? atual : menor));

  const alocados = new Set();
  for (const jogador of ordenados) {
    const disponiveis = comVaga();
    if (disponiveis.length === 0) break;
    const alvo = menorSoma(disponiveis);
    alvo.jogadores.push(jogador);
    alvo.soma += jogador.nivel;
    alocados.add(jogador);
  }

  const sobra = ordenados.filter((j) => !alocados.has(j));
  for (const jogador of sobra) {
    const alvo = menorSoma(grupos);
    alvo.jogadores.push(jogador);
    alvo.soma += jogador.nivel;
  }

  return grupos.map((g) => g.jogadores);
}
