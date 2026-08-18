import { test } from "node:test";
import assert from "node:assert/strict";
import { sortearTimes } from "../js/logica/sorteio.js";
import { criarPartidaVazia, definirFormato } from "../js/logica/partida.js";
import { adicionarJogadorPool, alternarGoleiroPool } from "../js/logica/jogadores.js";

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

test("sortearTimes com pool pequeno (menos de 2 times completos) não forma fila de reserva", () => {
  let p = definirFormato(criarPartidaVazia(), 6);
  for (let i = 0; i < 8; i++) p = adicionarJogadorPool(p, `J${i}`, 3);

  p = sortearTimes(p);
  assert.deepEqual(p.filaReserva, []);
});

test("sortearTimes com pool grande forma times extras e guarda na fila de reserva", () => {
  let p = definirFormato(criarPartidaVazia(), 5);
  for (let i = 0; i < 20; i++) p = adicionarJogadorPool(p, `J${i}`, (i % 5) + 1);

  p = sortearTimes(p);
  assert.equal(p.times.casa.jogadores.length, 5);
  assert.equal(p.times.visitante.jogadores.length, 5);
  assert.equal(p.filaReserva.length, 2);
  assert.ok(p.filaReserva.every((time) => time.jogadores.length === 5));

  const totalDistribuido =
    p.times.casa.jogadores.length + p.times.visitante.jogadores.length + p.filaReserva.reduce((soma, t) => soma + t.jogadores.length, 0);
  assert.equal(totalDistribuido, 20);
});

test("sortearTimes distribui a sobra (pool não é múltiplo exato) como reserva extra dentro dos times", () => {
  let p = definirFormato(criarPartidaVazia(), 5);
  for (let i = 0; i < 22; i++) p = adicionarJogadorPool(p, `J${i}`, (i % 5) + 1);

  p = sortearTimes(p);
  const tamanhos = [p.times.casa.jogadores.length, p.times.visitante.jogadores.length, ...p.filaReserva.map((t) => t.jogadores.length)];
  assert.equal(tamanhos.reduce((a, b) => a + b, 0), 22);
  // 22 = 4 times de 5 + 2 sobrando -> exatamente 2 times com 6 jogadores, os outros 2 com 5
  assert.equal(tamanhos.filter((t) => t === 6).length, 2);
  assert.equal(tamanhos.filter((t) => t === 5).length, 2);
});

test("sortearTimes distribui 1 goleiro pra cada time quando há goleiros marcados no pool", () => {
  let p = definirFormato(criarPartidaVazia(), 6);
  for (let i = 0; i < 8; i++) p = adicionarJogadorPool(p, `J${i}`, (i % 5) + 1);
  const [id1, id2] = p.poolJogadores.slice(0, 2).map((j) => j.id);
  p = alternarGoleiroPool(p, id1);
  p = alternarGoleiroPool(p, id2);

  p = sortearTimes(p);
  const goleirosCasa = p.times.casa.jogadores.filter((j) => j.goleiro).length;
  const goleirosVisitante = p.times.visitante.jogadores.filter((j) => j.goleiro).length;
  assert.equal(goleirosCasa, 1);
  assert.equal(goleirosVisitante, 1);
});

test("sortearTimes com goleiro sobrando (mais goleiros que times) não perde nem duplica jogadores", () => {
  let p = definirFormato(criarPartidaVazia(), 6);
  for (let i = 0; i < 8; i++) p = adicionarJogadorPool(p, `J${i}`, (i % 5) + 1);
  // marca todo mundo como goleiro: só há vaga "garantida" pra 2 (casa e visitante),
  // o resto continua marcado como goleiro mas entra pelo sorteio normal por nível.
  const idsOriginais = p.poolJogadores.map((j) => j.id).sort();
  p.poolJogadores.forEach((j) => {
    p = alternarGoleiroPool(p, j.id);
  });

  p = sortearTimes(p);
  const todos = [...p.times.casa.jogadores, ...p.times.visitante.jogadores];
  assert.equal(todos.length, 8);
  assert.deepEqual(
    todos.map((j) => j.id).sort(),
    idsOriginais
  );
  assert.ok(p.times.casa.jogadores.some((j) => j.goleiro));
  assert.ok(p.times.visitante.jogadores.some((j) => j.goleiro));
});

test("sortearTitulares mantém o goleiro em campo mesmo quando ele fica de fora no sorteio normal", () => {
  let p = definirFormato(criarPartidaVazia(), 5);
  for (let i = 0; i < 22; i++) p = adicionarJogadorPool(p, `J${i}`, (i % 5) + 1);
  const idGoleiro = p.poolJogadores[0].id;
  p = alternarGoleiroPool(p, idGoleiro);

  p = sortearTimes(p);
  const todosOsTimes = [p.times.casa, p.times.visitante, ...p.filaReserva];
  const timeDoGoleiro = todosOsTimes.find((time) => time.jogadores.some((j) => j.id === idGoleiro));
  const goleiroNoTime = timeDoGoleiro.jogadores.find((j) => j.id === idGoleiro);
  assert.equal(goleiroNoTime.titular, true);
});

test("sortearTimes: cada time formado respeita o limite de titulares em campo", () => {
  let p = definirFormato(criarPartidaVazia(), 5);
  for (let i = 0; i < 22; i++) p = adicionarJogadorPool(p, `J${i}`, (i % 5) + 1);

  p = sortearTimes(p);
  const todosOsTimes = [p.times.casa, p.times.visitante, ...p.filaReserva];
  for (const time of todosOsTimes) {
    const titulares = time.jogadores.filter((j) => j.titular).length;
    assert.ok(titulares <= 5, `${time.nome ?? "time"} tem ${titulares} titulares, limite é 5`);
  }
});
