// Regras puras de sorteio de times. Sem DOM.
//
// Estratégia: separa quem tá marcado como goleiro e distribui 1 por time antes
// de mais nada (até acabarem os goleiros ou as vagas), pra ninguém ficar sem
// goleiro em campo só por acaso do sorteio. Só depois embaralha o resto do pool
// (aleatoriedade entre jogadores de mesmo nível), ordena por nível decrescente
// e distribui cada jogador pro time com a menor soma de nível até o momento —
// resultado balanceado sem precisar de força bruta.
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

  const limite = partida.formato.jogadoresPorTime;
  const embaralhados = embaralhar(partida.poolJogadores);
  const numTimesCompletos = Math.floor(embaralhados.length / limite);
  const numGrupos = Math.max(2, numTimesCompletos);

  const buckets = distribuirEmTimes(embaralhados, numGrupos, limite);

  if (numTimesCompletos < 2) {
    return montarDoisTimes(partida, buckets, limite);
  }
  return montarComFilaReserva(partida, buckets, limite);
}

function montarDoisTimes(partida, buckets, limite) {
  return {
    ...partida,
    filaReserva: [],
    times: {
      ...partida.times,
      casa: { ...partida.times.casa, jogadores: sortearTitulares(buckets[0].map((j) => ({ ...j, timeId: "casa" })), limite) },
      visitante: { ...partida.times.visitante, jogadores: sortearTitulares(buckets[1].map((j) => ({ ...j, timeId: "visitante" })), limite) }
    }
  };
}

function montarComFilaReserva(partida, buckets, limite) {
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

// Distribui `embaralhados` em `numGrupos` grupos de até `limitePorGrupo` jogadores.
// Primeiro reserva 1 goleiro pra cada grupo (se houver goleiros marcados no pool);
// o resto é ordenado por nível decrescente e vai sempre pro grupo de menor soma —
// balanceado sem precisar de força bruta. Jogadores que sobram (pool não é múltiplo
// exato de `limitePorGrupo`, incluindo goleiros excedentes) viram reserva extra: 1 a
// mais por grupo, também priorizando o de menor soma (sortearTitulares depois marca
// esse excedente como reserva dentro do time).
function distribuirEmTimes(embaralhados, numGrupos, limitePorGrupo) {
  const grupos = Array.from({ length: numGrupos }, () => ({ jogadores: [], soma: 0 }));

  const comVaga = () => grupos.filter((g) => g.jogadores.length < limitePorGrupo);
  const menorSoma = (lista) => lista.reduce((menor, atual) => (atual.soma < menor.soma ? atual : menor));

  const alocados = new Set();

  // 1 goleiro por grupo primeiro (mantém a ordem já embaralhada, então é aleatório
  // quem pega qual). Goleiro excedente (mais goleiros que grupos) vira jogador comum.
  const goleiros = embaralhados.filter((j) => j.goleiro);
  goleiros.slice(0, numGrupos).forEach((goleiro, indice) => {
    grupos[indice].jogadores.push(goleiro);
    grupos[indice].soma += goleiro.nivel;
    alocados.add(goleiro);
  });

  const restante = embaralhados.filter((j) => !alocados.has(j)).sort((a, b) => b.nivel - a.nivel);
  for (const jogador of restante) {
    const disponiveis = comVaga();
    if (disponiveis.length === 0) break;
    const alvo = menorSoma(disponiveis);
    alvo.jogadores.push(jogador);
    alvo.soma += jogador.nivel;
    alocados.add(jogador);
  }

  const sobra = embaralhados.filter((j) => !alocados.has(j));
  for (const jogador of sobra) {
    const alvo = menorSoma(grupos);
    alvo.jogadores.push(jogador);
    alvo.soma += jogador.nivel;
  }

  return grupos.map((g) => g.jogadores);
}
