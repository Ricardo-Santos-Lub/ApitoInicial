const CHAVE_PARTIDA = "apitoinicial_partida";

export function salvar(partida) {
  localStorage.setItem(CHAVE_PARTIDA, JSON.stringify(partida));
}

export function carregar() {
  const dados = localStorage.getItem(CHAVE_PARTIDA);
  return dados ? JSON.parse(dados) : null;
}

export function limpar() {
  localStorage.removeItem(CHAVE_PARTIDA);
}
