// Camada de UI: primeira tela do app, escolhe entre jogo amador (pelada) e profissional
// (campeonato) antes de cair na tela de sorteio de times.

export function renderTelaModo(callbacks) {
  const app = document.getElementById("app");
  app.classList.remove("tem-nav-inferior");

  app.innerHTML = `
    <sl-card class="card card-modo">
      <h2>⚽ Jogo Amador</h2>
      <p class="contador-jogadores">
        Pelada: um tempo só (sem 1º/2º tempo), quem fizer 2 gols primeiro vence. Em caso de
        empate, os times trocam conforme a fila de espera.
      </p>
      <sl-button variant="primary" size="large" pill class="botao-full" data-modo="amador">Jogar Amador</sl-button>
    </sl-card>

    <sl-card class="card card-modo">
      <h2>🏆 Jogo Profissional</h2>
      <p class="contador-jogadores">
        Partida tradicional em dois tempos, com intervalo.
      </p>
      <sl-button variant="primary" size="large" pill class="botao-full" data-modo="profissional">Jogar Profissional</sl-button>
    </sl-card>
  `;

  app.querySelectorAll("[data-modo]").forEach((btn) => {
    btn.addEventListener("click", () => callbacks.onEscolherModo(btn.dataset.modo));
  });
}
