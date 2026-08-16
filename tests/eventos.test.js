import { test } from "node:test";
import assert from "node:assert/strict";
import { registrarGol, registrarSubstituicao, removerEvento, buscarJogador } from "../js/logica/eventos.js";
import { criarPartidaVazia } from "../js/logica/partida.js";
import { adicionarJogador } from "../js/logica/jogadores.js";

function partidaComDoisJogadores() {
  let p = criarPartidaVazia();
  p = adicionarJogador(p, "casa", "Titular", 9);
  p = adicionarJogador(p, "casa", "Reserva", 10);
  p.times.casa.jogadores[1].titular = false; // segundo jogador começa no banco
  return p;
}

test("registrarGol soma no placar e cria evento com o minuto atual", () => {
  let p = { ...criarPartidaVazia(), minutoAtual: 12 };
  p = adicionarJogador(p, "casa", "Artilheiro", 9);
  const jogadorId = p.times.casa.jogadores[0].id;

  p = registrarGol(p, "casa", jogadorId);
  assert.equal(p.placar.casa, 1);
  assert.equal(p.eventos.length, 1);
  assert.equal(p.eventos[0].minuto, 12);
  assert.equal(p.eventos[0].tipo, "gol");
});

test("registrarSubstituicao troca quem está titular sem mexer no placar", () => {
  let p = partidaComDoisJogadores();
  const [titular, reserva] = p.times.casa.jogadores;

  p = registrarSubstituicao(p, "casa", titular.id, reserva.id);
  const atualizados = p.times.casa.jogadores;
  assert.equal(atualizados.find((j) => j.id === titular.id).titular, false);
  assert.equal(atualizados.find((j) => j.id === reserva.id).titular, true);
  assert.deepEqual(p.placar, { casa: 0, visitante: 0 });
});

test("removerEvento desfaz o gol no placar, mas não mexe no placar de uma substituição", () => {
  let p = criarPartidaVazia();
  p = adicionarJogador(p, "casa", "A", 9);
  const jogadorId = p.times.casa.jogadores[0].id;
  p = registrarGol(p, "casa", jogadorId);
  p = registrarGol(p, "casa", jogadorId);
  assert.equal(p.placar.casa, 2);

  p = removerEvento(p, p.eventos[0].id);
  assert.equal(p.placar.casa, 1);
  assert.equal(p.eventos.length, 1);
});

test("removerEvento nunca deixa o placar negativo", () => {
  let p = criarPartidaVazia();
  p = adicionarJogador(p, "casa", "A", 9);
  p = registrarGol(p, "casa", p.times.casa.jogadores[0].id);
  p = { ...p, placar: { ...p.placar, casa: 0 } }; // estado inconsistente forçado
  p = removerEvento(p, p.eventos[0].id);
  assert.equal(p.placar.casa, 0);
});

test("removerEvento com id inexistente é no-op", () => {
  const p = criarPartidaVazia();
  assert.equal(removerEvento(p, 999), p);
});

test("buscarJogador retorna null quando não encontra", () => {
  const p = criarPartidaVazia();
  assert.equal(buscarJogador(p, "casa", 999), null);
});
