// Regras puras de registro de eventos da partida. Sem DOM.

export function registrarGol(partida, timeId, jogadorId) {
  const evento = {
    id: partida.proximoEventoId,
    tipo: "gol",
    timeId,
    jogadorId,
    minuto: partida.minutoAtual,
    tempo: partida.tempo
  };
  return {
    ...partida,
    proximoEventoId: partida.proximoEventoId + 1,
    eventos: [...partida.eventos, evento],
    placar: { ...partida.placar, [timeId]: partida.placar[timeId] + 1 }
  };
}

export function registrarSubstituicao(partida, timeId, jogadorSaiId, jogadorEntraId) {
  const evento = {
    id: partida.proximoEventoId,
    tipo: "substituicao",
    timeId,
    jogadorSaiId,
    jogadorEntraId,
    minuto: partida.minutoAtual,
    tempo: partida.tempo
  };

  // A substituição também troca quem está em campo (titular) e quem vai pro banco (reserva).
  const jogadoresAtualizados = partida.times[timeId].jogadores.map((j) => {
    if (j.id === jogadorSaiId) return { ...j, titular: false };
    if (j.id === jogadorEntraId) return { ...j, titular: true };
    return j;
  });

  return {
    ...partida,
    proximoEventoId: partida.proximoEventoId + 1,
    eventos: [...partida.eventos, evento],
    times: {
      ...partida.times,
      [timeId]: { ...partida.times[timeId], jogadores: jogadoresAtualizados }
    }
  };
}

export function removerEvento(partida, eventoId) {
  const evento = partida.eventos.find((e) => e.id === eventoId);
  if (!evento) return partida;

  const eventos = partida.eventos.filter((e) => e.id !== eventoId);
  const placar =
    evento.tipo === "gol"
      ? { ...partida.placar, [evento.timeId]: Math.max(0, partida.placar[evento.timeId] - 1) }
      : partida.placar;

  return { ...partida, eventos, placar };
}

export function buscarJogador(partida, timeId, jogadorId) {
  return partida.times[timeId].jogadores.find((j) => j.id === jogadorId) || null;
}
