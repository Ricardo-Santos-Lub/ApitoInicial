import { test } from "node:test";
import assert from "node:assert/strict";
import { sortearTimes } from "../js/logica/sorteio.js";
import { criarPartidaVazia, definirFormato } from "../js/logica/partida.js";
import { adicionarJogadorPool } from "../js/logica/jogadores.js";

test("sortearTimes não faz nada com menos de 2 jogadores no pool", () => {
  const p = adicionarJogadorPool(criarPartidaVazia(), "Sozinho", 5);
  assert.equal(sortearTimes(p), p);
});

test("sortearTimes distribui todo mundo do pool e balanceia por nível", () => {
  let p = definirFormato(criarPartidaVazia(), 6);
  const niveis = [5, 5, 4, 4, 3, 3, 2, 2];
  niveis.forEach((nivel, i) => {
    p = adicionarJogadorPool(p, `Jogador${i}`, nivel);
  });

  p = sortearTimes(p);
  const totalDistribuido = p.times.casa.jogadores.length + p.times.visitante.jogadores.length;
  assert.equal(totalDistribuido, niveis.length);

  const somaCasa = p.times.casa.jogadores.reduce((soma, j) => soma + j.nivel, 0);
  const somaVisitante = p.times.visitante.jogadores.reduce((soma, j) => soma + j.nivel, 0);
  assert.equal(somaCasa, somaVisitante); // niveis simétricos → soma deve empatar
});

test("sortearTimes atribui timeId correto a cada jogador distribuído", () => {
  let p = definirFormato(criarPartidaVazia(), 6);
  for (let i = 0; i < 6; i++) p = adicionarJogadorPool(p, `J${i}`, 3);

  p = sortearTimes(p);
  assert.ok(p.times.casa.jogadores.every((j) => j.timeId === "casa"));
  assert.ok(p.times.visitante.jogadores.every((j) => j.timeId === "visitante"));
});
