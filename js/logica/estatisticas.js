// Regras puras de estatísticas por jogador, derivadas dos eventos. Sem DOM.

export function calcularEstatisticas(partida, timeId) {
  const contagem = new Map();

  for (const evento of partida.eventos) {
    if (evento.timeId !== timeId || evento.tipo === "substituicao") continue;

    if (!contagem.has(evento.jogadorId)) {
      contagem.set(evento.jogadorId, { gols: 0 });
    }
    const stats = contagem.get(evento.jogadorId);
    if (evento.tipo === "gol") stats.gols += 1;
  }

  const jogadores = partida.times[timeId].jogadores;

  return [...contagem.entries()]
    .map(([jogadorId, stats]) => {
      const jogador = jogadores.find((j) => j.id === jogadorId);
      return { jogadorId, nome: jogador?.nome ?? "?", numero: jogador?.numero ?? null, ...stats };
    })
    .sort((a, b) => b.gols - a.gols);
}

// Artilharia da sessão inteira: soma os gols da rodada atual (partida.eventos) com os
// de rodadas já encerradas do rodízio (partida.historicoEventos — ver logica/rodizio.js e
// rodizioAmador.js), sem se prender a qual time está em "casa"/"visitante" agora, já que
// isso muda a cada rotação. O nome/time do jogador é resolvido pelo elenco atual (times
// casa/visitante + fila de reserva), onde o jogador sempre continua presente.
export function calcularEstatisticasGerais(partida) {
  const todosEventos = [...partida.historicoEventos, ...partida.eventos];
  const todosJogadores = [
    ...partida.times.casa.jogadores.map((j) => ({ ...j, timeNome: partida.times.casa.nome })),
    ...partida.times.visitante.jogadores.map((j) => ({ ...j, timeNome: partida.times.visitante.nome })),
    ...partida.filaReserva.flatMap((time) => time.jogadores.map((j) => ({ ...j, timeNome: time.nome })))
  ];

  const contagem = new Map();
  for (const evento of todosEventos) {
    if (evento.tipo !== "gol") continue;
    if (!contagem.has(evento.jogadorId)) contagem.set(evento.jogadorId, { gols: 0 });
    contagem.get(evento.jogadorId).gols += 1;
  }

  return [...contagem.entries()]
    .map(([jogadorId, stats]) => {
      const jogador = todosJogadores.find((j) => j.id === jogadorId);
      return {
        jogadorId,
        nome: jogador?.nome ?? "?",
        numero: jogador?.numero ?? null,
        timeNome: jogador?.timeNome ?? null,
        ...stats
      };
    })
    .sort((a, b) => b.gols - a.gols);
}
