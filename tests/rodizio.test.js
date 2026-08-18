import { test } from "node:test";
import assert from "node:assert/strict";
import { precisaDeDesempate, registrarPenaltis, calcularVencedor, iniciarProximaRodada } from "../js/logica/rodizio.js";
import { criarPartidaVazia, definirFormato, definirTime } from "../js/logica/partida.js";
import { adicionarJogadorPool } from "../js/logica/jogadores.js";
import { sortearTimes } from "../js/logica/sorteio.js";

function partidaComFila(numJogadores = 20, jogadoresPorTime = 5) {
  let p = definirFormato(criarPartidaVazia(), jogadoresPorTime);
  for (let i = 0; i < numJogadores; i++) p = adicionarJogadorPool(p, `J${i}`, (i % 5) + 1);
  p = sortearTimes(p);
  p = definirTime(p, "casa", { nome: "Casa" });
  p = definirTime(p, "visitante", { nome: "Visitante" });
  return p;
}

test("precisaDeDesempate só é true com placar empatado E fila não vazia", () => {
  const p = partidaComFila();
  assert.equal(precisaDeDesempate({ ...p, placar: { casa: 2, visitante: 2 } }), true);
  assert.equal(precisaDeDesempate({ ...p, placar: { casa: 2, visitante: 1 } }), false);
  assert.equal(precisaDeDesempate({ ...p, placar: { casa: 1, visitante: 1 }, filaReserva: [] }), false);
});

test("calcularVencedor usa o placar quando não está empatado", () => {
  const p = partidaComFila();
  assert.equal(calcularVencedor({ ...p, placar: { casa: 3, visitante: 1 } }), "casa");
  assert.equal(calcularVencedor({ ...p, placar: { casa: 1, visitante: 3 } }), "visitante");
});

test("calcularVencedor retorna null em empate sem pênaltis, e usa os pênaltis quando registrados", () => {
  const p = { ...partidaComFila(), placar: { casa: 2, visitante: 2 } };
  assert.equal(calcularVencedor(p), null);

  const comPenaltis = registrarPenaltis(p, 5, 4);
  assert.equal(calcularVencedor(comPenaltis), "casa");
});

test("calcularVencedor continua null se os pênaltis também empatarem", () => {
  const p = registrarPenaltis({ ...partidaComFila(), placar: { casa: 1, visitante: 1 } }, 3, 3);
  assert.equal(calcularVencedor(p), null);
});

test("iniciarProximaRodada é no-op se ainda não há vencedor definido", () => {
  const p = { ...partidaComFila(), placar: { casa: 1, visitante: 1 } };
  assert.equal(iniciarProximaRodada(p, p.filaReserva[0].id), p);
});

test("iniciarProximaRodada com fila de 1: promove automaticamente, ignora o id passado", () => {
  let p = partidaComFila();
  p = { ...p, filaReserva: [p.filaReserva[0]], placar: { casa: 0, visitante: 2 } };
  const nomeTimeDaFila = p.filaReserva[0].nome;

  const proxima = iniciarProximaRodada(p);
  assert.equal(proxima.times.casa.nome, nomeTimeDaFila); // casa perdeu, foi substituída
  assert.equal(proxima.times.visitante.nome, "Visitante"); // venceu, mantém o lugar
  assert.equal(proxima.filaReserva.length, 1);
  assert.equal(proxima.filaReserva[0].nome, "Casa"); // perdedor vai pro fim da fila
});

test("iniciarProximaRodada com fila de 2+: usa o time indicado por timeReservaId", () => {
  const p = { ...partidaComFila(), placar: { casa: 3, visitante: 0 } };
  const escolhido = p.filaReserva[1];

  const proxima = iniciarProximaRodada(p, escolhido.id);
  assert.equal(proxima.times.visitante.nome, escolhido.nome); // visitante perdeu, foi substituído
  assert.equal(proxima.times.casa.nome, "Casa"); // venceu, mantém
  assert.equal(proxima.filaReserva.length, 2);
  assert.ok(proxima.filaReserva.some((t) => t.nome === "Visitante")); // perdedor entrou na fila
  assert.ok(!proxima.filaReserva.some((t) => t.id === escolhido.id)); // quem entrou saiu da fila
});

test("iniciarProximaRodada zera placar, eventos e cronômetro pra nova rodada", () => {
  const p = {
    ...partidaComFila(),
    placar: { casa: 2, visitante: 0 },
    eventos: [{ id: 1, tipo: "gol" }],
    minutoAtual: 15,
    segundoAtual: 30,
    status: "encerrada",
    tempo: "2_tempo"
  };

  const proxima = iniciarProximaRodada(p, p.filaReserva[0].id);
  assert.deepEqual(proxima.placar, { casa: 0, visitante: 0 });
  assert.deepEqual(proxima.eventos, []);
  assert.equal(proxima.minutoAtual, 0);
  assert.equal(proxima.segundoAtual, 0);
  assert.equal(proxima.status, "nao_iniciada");
  assert.equal(proxima.tempo, "1_tempo");
  assert.equal(proxima.tempoInicioEpoch, null);
  assert.equal(proxima.penaltis, null);
});

test("iniciarProximaRodada arquiva os eventos da rodada em historicoEventos antes de zerar", () => {
  const eventoRodada1 = { id: 1, tipo: "gol" };
  const p = {
    ...partidaComFila(),
    placar: { casa: 2, visitante: 0 },
    eventos: [eventoRodada1],
    historicoEventos: [{ id: 0, tipo: "gol" }] // rodada anterior, já arquivada antes desta
  };

  const proxima = iniciarProximaRodada(p, p.filaReserva[0].id);
  assert.deepEqual(proxima.historicoEventos, [{ id: 0, tipo: "gol" }, eventoRodada1]);
  assert.deepEqual(proxima.eventos, []);
});
