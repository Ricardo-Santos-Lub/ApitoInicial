// Camada de UI: tela de estatísticas por jogador. Só lê o estado e desenha.

import { ativarRipple } from "./ripple.js";
import { calcularEstatisticas } from "../logica/estatisticas.js";
import { escapeHtml } from "./dom.js";

export function renderEstatisticas(partida, callbacks) {
  const app = document.getElementById("app");
  app.classList.remove("tem-nav-inferior");

  app.innerHTML = `
    <div class="cabecalho-tela">
      <sl-icon-button class="botao-voltar" name="chevron-left" label="Voltar ao placar" id="btnVoltarTopo"></sl-icon-button>
      <h2>⚽ Estatísticas</h2>
    </div>

    <sl-card class="card">
      <p class="status-partida">
        ${escapeHtml(partida.times.casa.nome)} ${partida.placar.casa} x ${partida.placar.visitante} ${escapeHtml(partida.times.visitante.nome)}
      </p>
    </sl-card>

    <sl-card class="card" style="--cor-time:${partida.times.casa.cor}">
      <h2 class="titulo-time-cor">${escapeHtml(partida.times.casa.nome)}</h2>
      ${renderListaEstatisticas(partida, "casa")}
    </sl-card>

    <sl-card class="card" style="--cor-time:${partida.times.visitante.cor}">
      <h2 class="titulo-time-cor">${escapeHtml(partida.times.visitante.nome)}</h2>
      ${renderListaEstatisticas(partida, "visitante")}
    </sl-card>

    <div class="botao-principal-wrap">
      <sl-button variant="primary" outline pill class="botao-full" id="btnVoltarPlacar">Voltar ao placar</sl-button>
    </div>
  `;

  app.querySelector("#btnVoltarPlacar").addEventListener("click", callbacks.onVoltar);
  app.querySelector("#btnVoltarTopo").addEventListener("click", callbacks.onVoltar);
  ativarRipple(app);
}

function renderListaEstatisticas(partida, timeId) {
  const stats = calcularEstatisticas(partida, timeId);
  if (!stats.length) {
    return `<p class="lista-vazia">Nenhum gol registrado ainda</p>`;
  }

  const itens = stats
    .map(
      (s) => `
      <li class="item-estatistica">
        <span>${s.numero != null ? `<span class="badge-numero">${s.numero}</span> ` : ""}${escapeHtml(s.nome)}</span>
        <span class="tags-estatistica">
          ${s.gols ? `<span class="tag-stat">⚽ ${s.gols}</span>` : ""}
        </span>
      </li>`
    )
    .join("");

  return `<ul class="lista-jogadores">${itens}</ul>`;
}

