// Camada de UI: súmula final da partida — placar, escalação, estatísticas e timeline completa.
// Só leitura (a partida já está encerrada). Só lê o estado e desenha.

import { ativarRipple } from "./ripple.js";
import { calcularEstatisticas } from "../logica/estatisticas.js";
import { ICONE_EVENTO, ROTULO_TEMPO_CURTO, descreverEvento } from "./timelineFormato.js";
import { iconeVoltar } from "./icones.js";
import { escapeHtml } from "./dom.js";

export function renderSumula(partida, callbacks) {
  const app = document.getElementById("app");
  app.classList.remove("tem-nav-inferior");
  const casa = partida.times.casa;
  const visitante = partida.times.visitante;

  app.innerHTML = `
    <div class="cabecalho-tela">
      <button class="botao-voltar ripple" id="btnVoltarTopo" title="Voltar ao placar">${iconeVoltar}</button>
      <h2>📋 Súmula final</h2>
    </div>

    <section class="card placar-card">
      <p class="status-partida">${formatarData(partida.data)} · Súmula final</p>
      <div class="placar-linha">
        <div class="placar-time" style="--cor-time:${casa.cor}">
          <span class="placar-nome">${escapeHtml(casa.nome)}</span>
        </div>
        <div class="placar-numeros">
          <span>${partida.placar.casa}</span>
          <span class="placar-separador">x</span>
          <span>${partida.placar.visitante}</span>
        </div>
        <div class="placar-time placar-time-direita" style="--cor-time:${visitante.cor}">
          <span class="placar-nome">${escapeHtml(visitante.nome)}</span>
        </div>
      </div>
    </section>

    <section class="card" style="--cor-time:${casa.cor}">
      <h2 class="titulo-time-cor">Escalação — ${escapeHtml(casa.nome)}</h2>
      ${renderEscalacao(partida, "casa")}
    </section>

    <section class="card" style="--cor-time:${visitante.cor}">
      <h2 class="titulo-time-cor">Escalação — ${escapeHtml(visitante.nome)}</h2>
      ${renderEscalacao(partida, "visitante")}
    </section>

    <section class="card" style="--cor-time:${casa.cor}">
      <h2 class="titulo-time-cor">Artilharia — ${escapeHtml(casa.nome)}</h2>
      ${renderListaEstatisticas(partida, "casa")}
    </section>

    <section class="card" style="--cor-time:${visitante.cor}">
      <h2 class="titulo-time-cor">Artilharia — ${escapeHtml(visitante.nome)}</h2>
      ${renderListaEstatisticas(partida, "visitante")}
    </section>

    <section class="card">
      <h2>Linha do tempo completa</h2>
      <ul class="timeline-lista">${renderTimelineCompleta(partida)}</ul>
    </section>

    <div class="botao-principal-wrap">
      <button class="botao secundario ripple" id="btnVoltarSumula">Voltar ao placar</button>
    </div>
  `;

  app.querySelector("#btnVoltarSumula").addEventListener("click", callbacks.onVoltar);
  app.querySelector("#btnVoltarTopo").addEventListener("click", callbacks.onVoltar);
  ativarRipple(app);
}

function renderEscalacao(partida, timeId) {
  const titulares = partida.times[timeId].jogadores.filter((j) => j.titular);
  const reservas = partida.times[timeId].jogadores.filter((j) => !j.titular);

  const item = (j) => `<li><span>${j.numero != null ? `<span class="badge-numero">${j.numero}</span> ` : ""}${escapeHtml(j.nome)}</span></li>`;

  const listaTitulares = titulares.length
    ? titulares.map(item).join("")
    : `<li class="lista-vazia">Nenhum titular registrado</li>`;

  return `
    <p class="contador-jogadores">Em campo (${titulares.length})</p>
    <ul class="lista-jogadores">${listaTitulares}</ul>
    ${
      reservas.length
        ? `<p class="contador-jogadores">Reserva (${reservas.length})</p><ul class="lista-jogadores">${reservas.map(item).join("")}</ul>`
        : ""
    }
  `;
}

function renderListaEstatisticas(partida, timeId) {
  const stats = calcularEstatisticas(partida, timeId);
  if (!stats.length) {
    return `<p class="lista-vazia">Nenhum gol registrado</p>`;
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

function renderTimelineCompleta(partida) {
  if (!partida.eventos.length) {
    return `<li class="lista-vazia">Nenhum evento registrado</li>`;
  }
  return [...partida.eventos]
    .reverse()
    .map(
      (evento) => `
      <li class="item-timeline">
        <span class="timeline-minuto">${evento.minuto}' <small>${ROTULO_TEMPO_CURTO[evento.tempo]}</small></span>
        <span class="timeline-icone">${ICONE_EVENTO[evento.tipo]}</span>
        <span class="timeline-descricao">${descreverEvento(partida, evento)}</span>
      </li>`
    )
    .join("");
}

function formatarData(dataIso) {
  const [ano, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}/${ano}`;
}

