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
