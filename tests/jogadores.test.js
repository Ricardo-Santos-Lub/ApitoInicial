import { test } from "node:test";
import assert from "node:assert/strict";
import {
  adicionarJogador,
  removerJogador,
  numeroJaUsado,
  adicionarJogadorPool,
  removerJogadorPool,
  alternarGoleiroPool
} from "../js/logica/jogadores.js";
import { criarPartidaVazia } from "../js/logica/partida.js";

test("adicionarJogador entra como titular e incrementa o próximo id", () => {
  let p = criarPartidaVazia();
  p = adicionarJogador(p, "casa", "Fulano", 9);
  assert.equal(p.times.casa.jogadores.length, 1);
  assert.equal(p.times.casa.jogadores[0].titular, true);
  assert.equal(p.times.casa.jogadores[0].numero, 9);
  assert.equal(p.proximoJogadorId, 2);
});

test("adicionarJogador aceita camisa número 0", () => {
  const p = adicionarJogador(criarPartidaVazia(), "casa", "Fulano", 0);
  assert.equal(p.times.casa.jogadores[0].numero, 0);
});

test("removerJogador tira só o jogador certo, do time certo", () => {
  let p = criarPartidaVazia();
  p = adicionarJogador(p, "casa", "A", 1);
  p = adicionarJogador(p, "casa", "B", 2);
  p = removerJogador(p, "casa", 1);
  assert.equal(p.times.casa.jogadores.length, 1);
  assert.equal(p.times.casa.jogadores[0].nome, "B");
});

test("numeroJaUsado detecta duplicidade só dentro do mesmo time", () => {
  let p = criarPartidaVazia();
  p = adicionarJogador(p, "casa", "A", 10);
  assert.equal(numeroJaUsado(p, "casa", 10), true);
  assert.equal(numeroJaUsado(p, "casa", 11), false);
  assert.equal(numeroJaUsado(p, "visitante", 10), false);
});

test("pool: adicionar e remover jogador sem time (modo sorteio)", () => {
  let p = criarPartidaVazia();
  p = adicionarJogadorPool(p, "Ciclano", 3);
  assert.equal(p.poolJogadores.length, 1);
  assert.equal(p.poolJogadores[0].timeId, null);
  assert.equal(p.poolJogadores[0].goleiro, false);

  p = removerJogadorPool(p, p.poolJogadores[0].id);
  assert.equal(p.poolJogadores.length, 0);
});

test("alternarGoleiroPool liga e desliga a marcação, sem afetar outros jogadores", () => {
  let p = criarPartidaVazia();
  p = adicionarJogadorPool(p, "Ciclano", 3);
  p = adicionarJogadorPool(p, "Beltrano", 4);
  const [id1, id2] = p.poolJogadores.map((j) => j.id);

  p = alternarGoleiroPool(p, id1);
  assert.equal(p.poolJogadores.find((j) => j.id === id1).goleiro, true);
  assert.equal(p.poolJogadores.find((j) => j.id === id2).goleiro, false);

  p = alternarGoleiroPool(p, id1);
  assert.equal(p.poolJogadores.find((j) => j.id === id1).goleiro, false);
});
