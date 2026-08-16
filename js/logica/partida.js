// Regras puras da partida. Nenhuma função aqui toca no DOM —
// só recebem e devolvem dados, para poder ser reaproveitadas em outra UI (ex: Expo).

export function criarPartidaVazia() {
  return {
    id: Date.now(),
    data: dataLocalHoje(),
    formato: { jogadoresPorTime: 10, duracaoMinutos: 20 },
    status: "nao_iniciada", // nao_iniciada | em_andamento | intervalo | encerrada
    tempo: "1_tempo", // 1_tempo | 2_tempo
    minutoAtual: 0, // tempo decorrido no tempo atual (a UI mostra a contagem regressiva a partir da duração)
    segundoAtual: 0,
    tempoBaseSegundos: 0, // segundos acumulados até a última referência de tempo real
    tempoInicioEpoch: null, // Date.now() de quando o cronômetro atual começou a correr; null quando parado
    proximoJogadorId: 1,
    proximoEventoId: 1,
    proximoTimeReservaId: 1,
    modoFormacao: "manual", // manual | sorteio
    poolJogadores: [], // jogadores sem time, usados só no modo sorteio
    times: {
      casa: { nome: "", cor: "#1e88e5", jogadores: [] },
      visitante: { nome: "", cor: "#e53935", jogadores: [] }
    },
    // Times sorteados além dos 2 que já entram em campo — modo sorteio com jogadores
    // suficientes pra formar 3+ times. Fila de espera pra substituir quem perder (ver logica/rodizio.js).
    filaReserva: [],
    placar: { casa: 0, visitante: 0 },
    eventos: [],
    penaltis: null // { casa, visitante } só durante um desempate no modo rodízio
  };
}

export function definirFormato(partida, jogadoresPorTime) {
  return {
    ...partida,
    formato: { ...partida.formato, jogadoresPorTime }
  };
}

export function definirDuracao(partida, duracaoMinutos) {
  return {
    ...partida,
    formato: { ...partida.formato, duracaoMinutos }
  };
}

export function definirModoFormacao(partida, modo) {
  if (modo === partida.modoFormacao) return partida;
  // Troca de modo zera os times: manual e sorteio não podem misturar dados.
  // A fila de reserva só existe no modo sorteio, então some junto.
  return {
    ...partida,
    modoFormacao: modo,
    filaReserva: [],
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

export function definirTimeReserva(partida, timeReservaId, dados) {
  return {
    ...partida,
    filaReserva: partida.filaReserva.map((time) => (time.id === timeReservaId ? { ...time, ...dados } : time))
  };
}

export function iniciarPartida(partida) {
  return marcarInicioCronometro({ ...partida, status: "em_andamento" });
}

// Chamada a cada segundo pelo cronômetro enquanto a partida está em andamento.
// Calcula o minuto a partir do relógio real (Date.now()) em vez de só somar +1 a cada
// chamada — assim o cronômetro não atrasa quando a aba fica em segundo plano/bloqueada
// (o navegador atrasa ou pausa o setInterval, mas o tempo real continua passando) e se
// autocorrige caso a partida seja recarregada com uma referência de tempo antiga/ausente.
export function avancarSegundo(partida) {
  if (partida.status !== "em_andamento") return partida;
  if (partida.tempoInicioEpoch == null) return marcarInicioCronometro(partida);

  const totalSegundos = partida.tempoBaseSegundos + Math.floor((Date.now() - partida.tempoInicioEpoch) / 1000);
  const minutoAtual = Math.floor(totalSegundos / 60);
  const segundoAtual = totalSegundos % 60;
  if (minutoAtual === partida.minutoAtual && segundoAtual === partida.segundoAtual) return partida;
  return { ...partida, minutoAtual, segundoAtual };
}

export function encerrarPrimeiroTempo(partida) {
  return pausarCronometro({ ...partida, status: "intervalo" });
}

export function iniciarSegundoTempo(partida) {
  return marcarInicioCronometro({ ...partida, status: "em_andamento", tempo: "2_tempo", minutoAtual: 0, segundoAtual: 0 });
}

export function encerrarPartida(partida) {
  return pausarCronometro({ ...partida, status: "encerrada" });
}

// Ancora tempoBaseSegundos/tempoInicioEpoch no minuto:segundo atuais de `partida`.
function marcarInicioCronometro(partida) {
  return {
    ...partida,
    tempoBaseSegundos: partida.minutoAtual * 60 + partida.segundoAtual,
    tempoInicioEpoch: Date.now()
  };
}

function pausarCronometro(partida) {
  return { ...partida, tempoBaseSegundos: partida.minutoAtual * 60 + partida.segundoAtual, tempoInicioEpoch: null };
}

export function validarPartida(partida) {
  if (!partida.formato.duracaoMinutos || partida.formato.duracaoMinutos <= 0) {
    return "Defina a duração de cada tempo.";
  }
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
