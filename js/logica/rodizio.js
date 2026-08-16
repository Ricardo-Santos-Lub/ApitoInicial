// Regras puras do modo rodízio (vencedor fica, perdedor sai pra fila). Sem DOM.
// Só entra em jogo quando o sorteio formou 3+ times (partida.filaReserva não vazia) —
// com só 2 times, o app se comporta como uma partida normal, sem nenhuma dessas regras.

// Só faz sentido desempatar nos pênaltis se houver alguém esperando pra jogar:
// sem fila, a sessão simplesmente termina e o empate fica registrado como está.
export function precisaDeDesempate(partida) {
  return partida.placar.casa === partida.placar.visitante && partida.filaReserva.length > 0;
}

export function registrarPenaltis(partida, penaltisCasa, penaltisVisitante) {
  return { ...partida, penaltis: { casa: penaltisCasa, visitante: penaltisVisitante } };
}

// "casa" | "visitante" | null (null = empatado e ainda sem pênaltis registrados).
export function calcularVencedor(partida) {
  if (partida.placar.casa !== partida.placar.visitante) {
    return partida.placar.casa > partida.placar.visitante ? "casa" : "visitante";
  }
  if (!partida.penaltis) return null;
  if (partida.penaltis.casa === partida.penaltis.visitante) return null;
  return partida.penaltis.casa > partida.penaltis.visitante ? "casa" : "visitante";
}

// Fecha a rodada atual: time vencedor mantém o lugar e a escalação, o perdedor vai pro
// fim da fila, e o time indicado por `timeReservaId` entra no lugar do perdedor (se a
// fila só tiver 1 time esperando, `timeReservaId` é opcional — usa esse único time).
export function iniciarProximaRodada(partida, timeReservaId = null) {
  const vencedorId = calcularVencedor(partida);
  if (!vencedorId) return partida; // ainda empatado sem pênaltis: nada a fazer

  const perdedorId = vencedorId === "casa" ? "visitante" : "casa";
  const idEscolhido = partida.filaReserva.length === 1 ? partida.filaReserva[0].id : timeReservaId;
  const timeEntra = partida.filaReserva.find((time) => time.id === idEscolhido);
  if (!timeEntra) return partida;

  const timePerdedor = {
    id: partida.proximoTimeReservaId,
    nome: partida.times[perdedorId].nome,
    cor: partida.times[perdedorId].cor,
    jogadores: partida.times[perdedorId].jogadores
  };

  return {
    ...partida,
    proximoTimeReservaId: partida.proximoTimeReservaId + 1,
    filaReserva: [...partida.filaReserva.filter((time) => time.id !== idEscolhido), timePerdedor],
    times: {
      ...partida.times,
      [perdedorId]: { ...partida.times[perdedorId], nome: timeEntra.nome, cor: timeEntra.cor, jogadores: timeEntra.jogadores }
    },
    placar: { casa: 0, visitante: 0 },
    eventos: [],
    status: "nao_iniciada",
    tempo: "1_tempo",
    minutoAtual: 0,
    segundoAtual: 0,
    tempoBaseSegundos: 0,
    tempoInicioEpoch: null,
    penaltis: null
  };
}
