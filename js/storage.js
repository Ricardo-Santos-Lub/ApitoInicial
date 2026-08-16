const CHAVE_PARTIDA = "apitoinicial_partida";

// localStorage pode lançar exceção (modo anônimo/privado bloqueando storage, cota
// cheia, dados corrompidos). Isso não pode derrubar o app: sem persistência, a
// partida continua funcionando normalmente em memória até a página ser fechada.
export function salvar(partida) {
  try {
    localStorage.setItem(CHAVE_PARTIDA, JSON.stringify(partida));
  } catch {
    // Sem persistência disponível — segue só em memória.
  }
}

export function carregar() {
  try {
    const dados = localStorage.getItem(CHAVE_PARTIDA);
    return dados ? JSON.parse(dados) : null;
  } catch {
    return null;
  }
}

export function limpar() {
  try {
    localStorage.removeItem(CHAVE_PARTIDA);
  } catch {
    // Sem persistência disponível — nada a limpar.
  }
}
