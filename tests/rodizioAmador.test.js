import { test } from "node:test";
import assert from "node:assert/strict";
import { precisaTrocaDupla, iniciarTrocaDupla } from "../js/logica/rodizioAmador.js";
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

test("precisaTrocaDupla só é true com placar empatado E fila com 2+ times", () => {
  const p = partidaComFila(); // 20 jogadores / 5 por time = 4 times -> fila com 2
  assert.equal(p.filaReserva.length, 2);
  assert.equal(precisaTrocaDupla({ ...p, placar: { casa: 1, visitante: 1 } }), true);
  assert.equal(precisaTrocaDupla({ ...p, placar: { casa: 2, visitante: 1 } }), false);
  assert.equal(precisaTrocaDupla({ ...p, placar: { casa: 1, visitante: 1 }, filaReserva: [p.filaReserva[0]] }), false);
  assert.equal(precisaTrocaDupla({ ...p, placar: { casa: 1, visitante: 1 }, filaReserva: [] }), false);
});

test("iniciarTrocaDupla é no-op fora da condição de empate + fila 2+", () => {
  const p = { ...partidaComFila(), placar: { casa: 2, visitante: 1 } };
  assert.equal(iniciarTrocaDupla(p), p);
});

test("iniciarTrocaDupla coloca os 2 primeiros da fila em casa/visitante e manda quem saiu pro fim da fila", () => {
  const p = { ...partidaComFila(), placar: { casa: 1, visitante: 1 } };
  const [entra1, entra2] = p.filaReserva;

  const proxima = iniciarTrocaDupla(p);

  assert.equal(proxima.times.casa.nome, entra1.nome);
  assert.equal(proxima.times.visitante.nome, entra2.nome);
  assert.equal(proxima.filaReserva.length, 2);
  assert.ok(proxima.filaReserva.some((t) => t.nome === "Casa"));
  assert.ok(proxima.filaReserva.some((t) => t.nome === "Visitante"));
  assert.ok(!proxima.filaReserva.some((t) => t.id === entra1.id));
  assert.ok(!proxima.filaReserva.some((t) => t.id === entra2.id));
});

test("iniciarTrocaDupla zera placar, eventos e cronômetro pra nova rodada", () => {
  const p = {
    ...partidaComFila(),
    placar: { casa: 2, visitante: 2 },
    eventos: [{ id: 1, tipo: "gol" }],
    minutoAtual: 12,
    segundoAtual: 40,
    status: "encerrada",
    tempo: "1_tempo"
  };

  const proxima = iniciarTrocaDupla(p);
  assert.deepEqual(proxima.placar, { casa: 0, visitante: 0 });
  assert.deepEqual(proxima.eventos, []);
  assert.equal(proxima.minutoAtual, 0);
  assert.equal(proxima.segundoAtual, 0);
  assert.equal(proxima.status, "nao_iniciada");
  assert.equal(proxima.tempo, "1_tempo");
  assert.equal(proxima.tempoInicioEpoch, null);
  assert.equal(proxima.penaltis, null);
});
