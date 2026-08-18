// Regras puras de cadastro de jogadores. Sem DOM.

export function adicionarJogador(partida, timeId, nome, numero) {
  const jogador = { id: partida.proximoJogadorId, nome, numero, timeId, titular: true };
  return {
    ...partida,
    proximoJogadorId: partida.proximoJogadorId + 1,
    times: {
      ...partida.times,
      [timeId]: {
        ...partida.times[timeId],
        jogadores: [...partida.times[timeId].jogadores, jogador]
      }
    }
  };
}

export function numeroJaUsado(partida, timeId, numero) {
  return partida.times[timeId].jogadores.some((j) => j.numero === numero);
}

export function removerJogador(partida, timeId, jogadorId) {
  return {
    ...partida,
    times: {
      ...partida.times,
      [timeId]: {
        ...partida.times[timeId],
        jogadores: partida.times[timeId].jogadores.filter((j) => j.id !== jogadorId)
      }
    }
  };
}

export function adicionarJogadorPool(partida, nome, nivel) {
  const jogador = { id: partida.proximoJogadorId, nome, nivel, timeId: null, goleiro: false };
  return {
    ...partida,
    proximoJogadorId: partida.proximoJogadorId + 1,
    poolJogadores: [...partida.poolJogadores, jogador]
  };
}

export function alternarGoleiroPool(partida, jogadorId) {
  return {
    ...partida,
    poolJogadores: partida.poolJogadores.map((j) => (j.id === jogadorId ? { ...j, goleiro: !j.goleiro } : j))
  };
}

export function removerJogadorPool(partida, jogadorId) {
  return {
    ...partida,
    poolJogadores: partida.poolJogadores.filter((j) => j.id !== jogadorId)
  };
}

export function atualizarNivelJogadorPool(partida, jogadorId, nivel) {
  return {
    ...partida,
    poolJogadores: partida.poolJogadores.map((j) => (j.id === jogadorId ? { ...j, nivel } : j))
  };
}
