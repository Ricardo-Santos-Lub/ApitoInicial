import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularEstatisticas } from "../js/logica/estatisticas.js";
import { criarPartidaVazia } from "../js/logica/partida.js";
import { adicionarJogador } from "../js/logica/jogadores.js";
import { registrarGol, registrarSubstituicao } from "../js/logica/eventos.js";

test("calcularEstatisticas soma gols por jogador e ordena do maior pro menor", () => {
  let p = criarPartidaVazia();
  p = adicionarJogador(p, "casa", "Artilheiro", 9);
  p = adicionarJogador(p, "casa", "Coadjuvante", 10);
  const [artilheiro, coadjuvante] = p.times.casa.jogadores;

  p = registrarGol(p, "casa", artilheiro.id);
  p = registrarGol(p, "casa", artilheiro.id);
  p = registrarGol(p, "casa", coadjuvante.id);

  const stats = calcularEstatisticas(p, "casa");
  assert.equal(stats.length, 2);
  assert.equal(stats[0].nome, "Artilheiro");
  assert.equal(stats[0].gols, 2);
  assert.equal(stats[1].nome, "Coadjuvante");
  assert.equal(stats[1].gols, 1);
});

test("calcularEstatisticas ignora eventos de substituição e do outro time", () => {
  let p = criarPartidaVazia();
  p = adicionarJogador(p, "casa", "A", 1);
  p = adicionarJogador(p, "casa", "B", 2);
  p = adicionarJogador(p, "visitante", "C", 1);
  const [a, b] = p.times.casa.jogadores;
  const [c] = p.times.visitante.jogadores;

  p = registrarSubstituicao(p, "casa", a.id, b.id);
  p = registrarGol(p, "visitante", c.id);

  assert.deepEqual(calcularEstatisticas(p, "casa"), []);
  assert.equal(calcularEstatisticas(p, "visitante").length, 1);
});

test("calcularEstatisticas retorna lista vazia sem eventos", () => {
  const p = criarPartidaVazia();
  assert.deepEqual(calcularEstatisticas(p, "casa"), []);
});
