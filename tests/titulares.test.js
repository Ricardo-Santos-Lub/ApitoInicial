import { test } from "node:test";
import assert from "node:assert/strict";
import { sortearTitulares, sortearTitularesTime } from "../js/logica/titulares.js";
import { criarPartidaVazia, definirFormato } from "../js/logica/partida.js";
import { adicionarJogador } from "../js/logica/jogadores.js";

test("sortearTitulares marca todo mundo como titular quando cabe no limite", () => {
  const jogadores = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const resultado = sortearTitulares(jogadores, 5);
  assert.ok(resultado.every((j) => j.titular === true));
});

test("sortearTitulares respeita o limite quando sobra gente (conta bate sempre)", () => {
  const jogadores = Array.from({ length: 15 }, (_, i) => ({ id: i + 1 }));
  const resultado = sortearTitulares(jogadores, 7);
  const titulares = resultado.filter((j) => j.titular);
  const reservas = resultado.filter((j) => !j.titular);
  assert.equal(titulares.length, 7);
  assert.equal(reservas.length, 8);
});

test("sortearTitularesTime aplica o limite do formato configurado na partida", () => {
  let p = definirFormato(criarPartidaVazia(), 2);
  for (let i = 0; i < 5; i++) p = adicionarJogador(p, "casa", `J${i}`, i + 1);

  p = sortearTitularesTime(p, "casa");
  const titulares = p.times.casa.jogadores.filter((j) => j.titular);
  assert.equal(titulares.length, 2);
});
