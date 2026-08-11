// Regras puras da partida. Nenhuma função aqui toca no DOM —
// só recebem e devolvem dados, para poder ser reaproveitadas em outra UI (ex: Expo).

export function criarPartidaVazia() {
  return {
    id: Date.now(),
    data: dataLocalHoje(),
    formato: { jogadoresPorTime: 10 },
    status: "nao_iniciada", // nao_iniciada | em_andamento | intervalo | encerrada
    tempo: "1_tempo", // 1_tempo | 2_tempo
    minutoAtual: 0,
    segundoAtual: 0,
    proximoJogadorId: 1,
    proximoEventoId: 1,
    modoFormacao: "manual", // manual | sorteio
    poolJogadores: [], // jogadores sem time, usados só no modo sorteio
    times: {
      casa: { nome: "", cor: "#1e88e5", jogadores: [] },
      visitante: { nome: "", cor: "#e53935", jogadores: [] }
    },
    placar: { casa: 0, visitante: 0 },
    eventos: []
  };
}

export function definirFormato(partida, jogadoresPorTime) {
  return {
    ...partida,
    formato: { ...partida.formato, jogadoresPorTime }
  };
}

export function definirModoFormacao(partida, modo) {
  if (modo === partida.modoFormacao) return partida;
  // Troca de modo zera os times: manual e sorteio não podem misturar dados.
  return {
    ...partida,
    modoFormacao: modo,
    times: {
      ...partida.times,
      casa: { ...partida.times.casa, jogadores: [] },
      visitante: { ...partida.times.visitante, jogadores: [] }
    }
  };
}

export function definirTime(partida, timeId, dados) {
  return {
    ...partida,
    times: {
      ...partida.times,
      [timeId]: { ...partida.times[timeId], ...dados }
    }
  };
}

export function iniciarPartida(partida) {
  return { ...partida, status: "em_andamento" };
}

export function ajustarMinuto(partida, delta) {
  return { ...partida, minutoAtual: Math.max(0, partida.minutoAtual + delta) };
}

export function definirMinuto(partida, minuto) {
  return { ...partida, minutoAtual: Math.max(0, minuto) };
}

// Chamada a cada segundo pelo cronômetro enquanto a partida está em andamento.
// Fora desse status, o relógio fica parado (retorna a mesma referência, sem re-render).
export function avancarSegundo(partida) {
  if (partida.status !== "em_andamento") return partida;
  const totalSegundos = partida.minutoAtual * 60 + partida.segundoAtual + 1;
  return {
    ...partida,
    minutoAtual: Math.floor(totalSegundos / 60),
    segundoAtual: totalSegundos % 60
  };
}

export function encerrarPrimeiroTempo(partida) {
  return { ...partida, status: "intervalo" };
}

export function iniciarSegundoTempo(partida) {
  return { ...partida, status: "em_andamento", tempo: "2_tempo", minutoAtual: 0, segundoAtual: 0 };
}

export function encerrarPartida(partida) {
  return { ...partida, status: "encerrada" };
}

export function validarPartida(partida) {
  if (!partida.times.casa.nome.trim() || !partida.times.visitante.nome.trim()) {
    return "Preencha o nome dos dois times.";
  }
  if (partida.times.casa.jogadores.length === 0 || partida.times.visitante.jogadores.length === 0) {
    return partida.modoFormacao === "sorteio"
      ? "Sorteie os times antes de iniciar a partida."
      : "Cadastre pelo menos 1 jogador em cada time.";
  }

  const limite = partida.formato.jogadoresPorTime;
  const titularesCasa = partida.times.casa.jogadores.filter((j) => j.titular).length;
  const titularesVisitante = partida.times.visitante.jogadores.filter((j) => j.titular).length;
  if (titularesCasa > limite || titularesVisitante > limite) {
    return `Ajuste os titulares: cada time pode ter no máximo ${limite} em campo. Use "Sortear titulares" pra definir quem fica de reserva.`;
  }

  return null;
}

// toISOString() usa UTC — perto da meia-noite isso muda a data local errada. Monta a partir dos campos locais.
function dataLocalHoje() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}
