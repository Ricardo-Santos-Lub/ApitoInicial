import { test } from "node:test";
import assert from "node:assert/strict";
import { embaralhar } from "../js/logica/aleatorio.js";

test("embaralhar preserva os mesmos elementos, só muda a ordem", () => {
  const original = [1, 2, 3, 4, 5, 6, 7, 8];
  const resultado = embaralhar(original);
  assert.deepEqual([...resultado].sort((a, b) => a - b), original);
});

test("embaralhar não muta o array original", () => {
  const original = [1, 2, 3];
  const copia = [...original];
  embaralhar(original);
  assert.deepEqual(original, copia);
});

test("embaralhar retorna uma referência de array nova", () => {
  const original = [1, 2, 3];
  assert.notEqual(embaralhar(original), original);
});
