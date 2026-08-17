import { test } from "node:test";
import assert from "node:assert/strict";
import {
  criarPartidaVazia,
  definirFormato,
  definirDuracao,
  definirModoFormacao,
  definirTime,
  iniciarPartida,
  avancarSegundo,
  encerrarPrimeiroTempo,
  iniciarSegundoTempo,
  encerrarPartida,
  validarPartida
} from "../js/logica/partida.js";
import { adicionarJogador } from "../js/logica/jogadores.js";

test("criarPartidaVazia começa não iniciada, zerada e sem cronômetro correndo", () => {
  const p = criarPartidaVazia();
  assert.equal(p.status, "nao_iniciada");
  assert.equal(p.minutoAtual, 0);
  assert.equal(p.segundoAtual, 0);
  assert.equal(p.tempoInicioEpoch, null);
  assert.deepEqual(p.placar, { casa: 0, visitante: 0 });
});

test("definirFormato só troca jogadoresPorTime, preserva o resto", () => {
  const p = definirFormato(criarPartidaVazia(), 7);
  assert.equal(p.formato.jogadoresPorTime, 7);
});

test("definirDuracao só troca duracaoMinutos, preserva o resto", () => {
  const p = definirDuracao(criarPartidaVazia(), 30);
  assert.equal(p.formato.duracaoMinutos, 30);
  assert.equal(p.formato.jogadoresPorTime, 10);
});

test("definirModoFormacao zera os jogadores dos dois times ao trocar de modo", () => {
  let p = definirModoFormacao(criarPartidaVazia(), "manual");
  p = adicionarJogador(p, "casa", "Fulano", 9);
  assert.equal(p.times.casa.jogadores.length, 1);

  p = definirModoFormacao(p, "sorteio");
  assert.equal(p.times.casa.jogadores.length, 0);
  assert.equal(p.modoFormacao, "sorteio");
});

test("definirModoFormacao é no-op se o modo já é o atual (não recria os times)", () => {
  const p = criarPartidaVazia();
  const p2 = definirModoFormacao(p, "sorteio");
  assert.equal(p, p2);
});

test("definirTime faz merge parcial dos dados do time", () => {
  const p = definirTime(criarPartidaVazia(), "casa", { nome: "Real Matismo" });
  assert.equal(p.times.casa.nome, "Real Matismo");
  assert.equal(p.times.casa.cor, "#1e88e5"); // preservado
});

test("iniciarPartida muda status e ancora a referência de tempo real", () => {
  const p = iniciarPartida(criarPartidaVazia());
  assert.equal(p.status, "em_andamento");
  assert.ok(p.tempoInicioEpoch != null);
  assert.equal(p.tempoBaseSegundos, 0);
});

test("avancarSegundo calcula o tempo a partir do relógio real, não por contagem de ticks", () => {
  let p = iniciarPartida(criarPartidaVazia());
  // simula 65s reais se passando (ex: aba em segundo plano) sem depender de setTimeout de verdade
  p = { ...p, tempoInicioEpoch: p.tempoInicioEpoch - 65_000 };
  p = avancarSegundo(p);
  assert.equal(p.minutoAtual, 1);
  assert.equal(p.segundoAtual, 5);
});

test("avancarSegundo fora de 'em_andamento' não altera a partida (mesma referência)", () => {
  const p = criarPartidaVazia();
  assert.equal(avancarSegundo(p), p);
});

test("avancarSegundo se autocorrige quando tempoInicioEpoch está ausente (dado antigo)", () => {
  let p = iniciarPartida(criarPartidaVazia());
  p = { ...p, minutoAtual: 5, segundoAtual: 30, tempoInicioEpoch: null };
  p = avancarSegundo(p);
  assert.ok(p.tempoInicioEpoch != null);
  assert.equal(p.minutoAtual, 5);
  assert.equal(p.segundoAtual, 30);
});

test("intervalo pausa o cronômetro e o 2º tempo reinicia do zero", () => {
  let p = iniciarPartida(criarPartidaVazia());
  p = { ...p, minutoAtual: 45, segundoAtual: 0 };
  p = encerrarPrimeiroTempo(p);
  assert.equal(p.status, "intervalo");
  assert.equal(p.tempoInicioEpoch, null);

  const antesDoTick = p;
  p = avancarSegundo(p);
  assert.equal(p, antesDoTick); // não avança durante o intervalo

  p = iniciarSegundoTempo(p);
  assert.equal(p.status, "em_andamento");
  assert.equal(p.tempo, "2_tempo");
  assert.equal(p.minutoAtual, 0);
  assert.equal(p.segundoAtual, 0);
  assert.ok(p.tempoInicioEpoch != null);
});

test("encerrarPartida pausa o cronômetro definitivamente", () => {
  let p = iniciarPartida(criarPartidaVazia());
  p = encerrarPartida(p);
  assert.equal(p.status, "encerrada");
  assert.equal(p.tempoInicioEpoch, null);
});

test("encerrarPartida zera o relógio (tempo restante) mesmo se sobrava tempo", () => {
  let p = iniciarPartida(criarPartidaVazia()); // duração padrão: 20 minutos
  p = { ...p, minutoAtual: 5, segundoAtual: 30 }; // encerrou com 14:30 restantes
  p = encerrarPartida(p);
  assert.equal(p.minutoAtual, 20);
  assert.equal(p.segundoAtual, 0);
});

test("validarPartida exige duração de cada tempo maior que zero", () => {
  const p = definirDuracao(criarPartidaVazia(), 0);
  assert.match(validarPartida(p), /duração de cada tempo/);
});

test("validarPartida exige nome dos dois times", () => {
  const p = criarPartidaVazia();
  assert.match(validarPartida(p), /nome dos dois times/);
});

test("validarPartida exige jogadores cadastrados (mensagem muda conforme o modo)", () => {
  let p = definirTime(criarPartidaVazia(), "casa", { nome: "A" });
  p = definirTime(p, "visitante", { nome: "B" });
  assert.match(validarPartida(p), /Sorteie os times/);

  p = definirModoFormacao(p, "manual");
  assert.match(validarPartida(p), /Cadastre pelo menos 1 jogador/);
});

test("validarPartida rejeita mais titulares em campo do que o formato permite", () => {
  let p = definirTime(criarPartidaVazia(), "casa", { nome: "A" });
  p = definirTime(p, "visitante", { nome: "B" });
  p = definirFormato(p, 1);
  p = adicionarJogador(p, "casa", "J1", 1);
  p = adicionarJogador(p, "casa", "J2", 2); // 2 titulares, limite é 1
  p = adicionarJogador(p, "visitante", "J3", 1);
  assert.match(validarPartida(p), /no máximo 1 em campo/);
});

test("validarPartida passa com dados válidos", () => {
  let p = definirTime(criarPartidaVazia(), "casa", { nome: "A" });
  p = definirTime(p, "visitante", { nome: "B" });
  p = adicionarJogador(p, "casa", "J1", 1);
  p = adicionarJogador(p, "visitante", "J2", 1);
  assert.equal(validarPartida(p), null);
});
