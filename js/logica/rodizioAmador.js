// Regra extra do modo amador em caso de empate no fim do tempo único: com pelo menos
// 2 times esperando na fila, os 2 times que empataram saem (voltam pro fim da fila) e os
// 2 próximos entram — sem disputa de pênaltis. Com só 1 time esperando ou fila vazia, o
// modo amador usa exatamente as mesmas regras do rodízio "profissional" (ver rodizio.js).

export function precisaTrocaDupla(partida) {
  return partida.placar.casa === partida.placar.visitante && partida.filaReserva.length >= 2;
}

// Fecha a rodada empatada: os 2 primeiros times da fila entram no lugar de casa/visitante,
// e quem estava jogando vai pro fim da fila (nessa ordem: casa, depois visitante).
export function iniciarTrocaDupla(partida) {
  if (!precisaTrocaDupla(partida)) return partida;

  const [entraCasa, entraVisitante, ...filaRestante] = partida.filaReserva;

  const saiCasa = {
    id: partida.proximoTimeReservaId,
    nome: partida.times.casa.nome,
    cor: partida.times.casa.cor,
    jogadores: partida.times.casa.jogadores
  };
  const saiVisitante = {
    id: partida.proximoTimeReservaId + 1,
    nome: partida.times.visitante.nome,
    cor: partida.times.visitante.cor,
    jogadores: partida.times.visitante.jogadores
  };

  return {
    ...partida,
    proximoTimeReservaId: partida.proximoTimeReservaId + 2,
    filaReserva: [...filaRestante, saiCasa, saiVisitante],
    times: {
      ...partida.times,
      casa: { ...partida.times.casa, nome: entraCasa.nome, cor: entraCasa.cor, jogadores: entraCasa.jogadores },
      visitante: { ...partida.times.visitante, nome: entraVisitante.nome, cor: entraVisitante.cor, jogadores: entraVisitante.jogadores }
    },
    placar: { casa: 0, visitante: 0 },
    eventos: [],
    historicoEventos: [...partida.historicoEventos, ...partida.eventos],
    status: "nao_iniciada",
    tempo: "1_tempo",
    minutoAtual: 0,
    segundoAtual: 0,
    tempoBaseSegundos: 0,
    tempoInicioEpoch: null,
    penaltis: null
  };
}
