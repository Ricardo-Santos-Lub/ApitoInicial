// Camada de UI: tela de placar + cronômetro + registro de eventos. Só lê o estado e desenha.

import { ativarRipple } from "./ripple.js";
import { buscarJogador } from "../logica/eventos.js";
import { ICONE_EVENTO, ROTULO_TEMPO_CURTO, descreverEvento } from "./timelineFormato.js";
import { iconeEstatisticas, iconeEditar } from "./icones.js";
import { escapeHtml } from "./dom.js";

const ROTULO_TEMPO = {
  "1_tempo": "1º Tempo",
  "2_tempo": "2º Tempo"
};

export function renderPlacar(partida, uiState, callbacks) {
  const app = document.getElementById("app");
  const casa = partida.times.casa;
  const visitante = partida.times.visitante;

  app.classList.add("tem-nav-inferior");

  app.innerHTML = `
    <section class="card placar-card">
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

    <section class="card cronometro-card">
      <p class="badge-status">${rotuloStatus(partida)}</p>
      <div class="cronometro">
        <button class="botao-minuto ripple" id="btnMenosMinuto" ${podeEditarMinuto(partida) ? "" : "disabled"}>−1</button>
        <div class="relogio-grande" id="relogioTexto">${formatarRelogio(partida)}</div>
        <button class="botao-minuto ripple" id="btnMaisMinuto" ${podeEditarMinuto(partida) ? "" : "disabled"}>+1</button>
      </div>

      <div class="correcao-minuto">
        <label for="minutoAtual">Corrigir minuto</label>
        <input type="number" id="minutoAtual" class="input-minuto" value="${partida.minutoAtual}" min="0"
          ${podeEditarMinuto(partida) ? "" : "disabled"}>
      </div>

      <div class="botoes-controle-tempo">
        ${renderBotaoControleTempo(partida)}
      </div>
    </section>

    <section class="card painel-eventos-card">
      ${renderPainelEventos(partida, uiState)}
    </section>

    <section class="card timeline-card">
      <h2>Linha do tempo</h2>
      <ul class="timeline-lista">${renderTimeline(partida)}</ul>
    </section>

    <nav class="nav-inferior">
      <button class="nav-inferior-item ripple" id="btnVerEstatisticas">${iconeEstatisticas}<span>Estatísticas</span></button>
      <button class="nav-inferior-item ripple" id="btnEditarTimes">${iconeEditar}<span>Editar times</span></button>
    </nav>
  `;

  vincularEventos(app, partida, uiState, callbacks);
  ativarRipple(app);
}

// Atualização leve do cronômetro, chamada a cada segundo pelo tick em main.js.
// Só troca o texto do relógio — não refaz o innerHTML da tela, pra não derrubar
// o foco de quem estiver digitando no campo de correção de minuto.
export function atualizarRelogio(partida) {
  const relogio = document.getElementById("relogioTexto");
  if (relogio) relogio.textContent = formatarRelogio(partida);

  // Só sincroniza o campo de correção se ele não estiver em uso, senão apagaria o que a pessoa está digitando.
  const inputMinuto = document.getElementById("minutoAtual");
  if (inputMinuto && document.activeElement !== inputMinuto) {
    inputMinuto.value = partida.minutoAtual;
  }
}

function formatarRelogio(partida) {
  const minuto = String(partida.minutoAtual).padStart(2, "0");
  const segundo = String(partida.segundoAtual).padStart(2, "0");
  return `${minuto}:${segundo}`;
}

function rotuloStatus(partida) {
  if (partida.status === "intervalo") return "Intervalo";
  if (partida.status === "encerrada") return "Partida encerrada";
  return ROTULO_TEMPO[partida.tempo];
}

function podeEditarMinuto(partida) {
  return partida.status === "em_andamento";
}

function renderBotaoControleTempo(partida) {
  if (partida.status === "em_andamento" && partida.tempo === "1_tempo") {
    return `<button class="botao ripple" id="btnEncerrarTempo">Encerrar 1º Tempo</button>`;
  }
  if (partida.status === "intervalo") {
    return `<button class="botao ripple" id="btnIniciarSegundoTempo">Iniciar 2º Tempo</button>`;
  }
  if (partida.status === "em_andamento" && partida.tempo === "2_tempo") {
    return `<button class="botao ripple" id="btnEncerrarPartida">Encerrar Partida</button>`;
  }
  if (partida.status === "encerrada") {
    return `
      <button class="botao secundario ripple" id="btnVerSumula">Ver súmula da partida</button>
      <button class="botao ripple" id="btnNovaPartida">Nova Partida</button>
    `;
  }
  return "";
}

// ===== Painel de registro de eventos =====

function renderPainelEventos(partida, uiState) {
  if (partida.status !== "em_andamento") {
    return `<p class="status-partida">Eventos só podem ser registrados com o jogo em andamento.</p>`;
  }

  if (!uiState.painelAberto) {
    return `
      <div class="acoes-evento">
        <button class="botao-evento ripple" data-abrir-painel="gol">⚽<span>Gol</span></button>
        <button class="botao-evento ripple" data-abrir-painel="substituicao">🔄<span>Substituição</span></button>
      </div>
    `;
  }

  if (uiState.painelAberto === "gol") {
    return `
      <h2>Quem marcou?</h2>
      ${renderListaSelecaoJogador(partida, "data-gol", { apenas: "titulares" })}
      <button class="botao secundario ripple" data-fechar-painel>Cancelar</button>
    `;
  }

  if (uiState.painelAberto === "substituicao") {
    if (!uiState.jogadorSaiSelecionado) {
      return `
        <h2>Quem sai? <small>(só quem está em campo)</small></h2>
        ${renderListaSelecaoJogador(partida, "data-sub-sai", { apenas: "titulares" })}
        <button class="botao secundario ripple" data-fechar-painel>Cancelar</button>
      `;
    }
    const { timeId, jogadorId } = uiState.jogadorSaiSelecionado;
    const jogadorSai = buscarJogador(partida, timeId, jogadorId);
    const reservasDisponiveis = renderListaSelecaoJogador(partida, "data-sub-entra", { timeIdFiltro: timeId, apenas: "reservas" });
    return `
      <h2>Quem entra no lugar de ${escapeHtml(jogadorSai?.nome ?? "")}?</h2>
      ${reservasDisponiveis || `<p class="lista-vazia">Esse time não tem reserva disponível.</p>`}
      <button class="botao secundario ripple" data-fechar-painel>Cancelar</button>
    `;
  }

  return "";
}

function renderListaSelecaoJogador(partida, atributoData, { timeIdFiltro = null, apenas = null } = {}) {
  const times = timeIdFiltro ? [timeIdFiltro] : ["casa", "visitante"];
  return times
    .map((timeId) => {
      let jogadores = partida.times[timeId].jogadores;
      if (apenas === "titulares") jogadores = jogadores.filter((j) => j.titular);
      if (apenas === "reservas") jogadores = jogadores.filter((j) => !j.titular);
      if (!jogadores.length) return "";
      const itens = jogadores
        .map(
          (j) => `
          <li>
            <button class="ripple item-selecao" ${atributoData}="${timeId}:${j.id}">
              <span class="dot-time" style="--cor-time:${partida.times[timeId].cor}"></span>
              ${rotuloJogador(j)}
            </button>
          </li>`
        )
        .join("");
      return `<p class="subtitulo-time">${escapeHtml(partida.times[timeId].nome)}</p><ul class="lista-selecao">${itens}</ul>`;
    })
    .join("");
}

function rotuloJogador(jogador) {
  return jogador.numero != null
    ? `<span class="badge-numero">${jogador.numero}</span> ${escapeHtml(jogador.nome)}`
    : escapeHtml(jogador.nome);
}

// ===== Timeline =====

function renderTimeline(partida) {
  if (!partida.eventos.length) {
    return `<li class="lista-vazia">Nenhum evento registrado ainda</li>`;
  }
  return [...partida.eventos]
    .reverse()
    .map(
      (evento) => `
      <li class="item-timeline">
        <span class="timeline-minuto">${evento.minuto}' <small>${ROTULO_TEMPO_CURTO[evento.tempo]}</small></span>
        <span class="timeline-icone">${ICONE_EVENTO[evento.tipo]}</span>
        <span class="timeline-descricao">${descreverEvento(partida, evento)}</span>
        <button class="ripple" data-remover-evento="${evento.id}" title="Remover evento">✕</button>
      </li>`
    )
    .join("");
}

// ===== Eventos DOM =====

function vincularEventos(app, partida, uiState, callbacks) {
  const btnMenos = app.querySelector("#btnMenosMinuto");
  const btnMais = app.querySelector("#btnMaisMinuto");
  const inputMinuto = app.querySelector("#minutoAtual");

  if (btnMenos) btnMenos.addEventListener("click", () => callbacks.onAjustarMinuto(-1));
  if (btnMais) btnMais.addEventListener("click", () => callbacks.onAjustarMinuto(1));
  if (inputMinuto) {
    inputMinuto.addEventListener("change", (e) => {
      const valor = parseInt(e.target.value, 10);
      callbacks.onDefinirMinuto(Number.isNaN(valor) ? 0 : valor);
    });
  }

  app.querySelector("#btnEncerrarTempo")?.addEventListener("click", callbacks.onEncerrarPrimeiroTempo);
  app.querySelector("#btnIniciarSegundoTempo")?.addEventListener("click", callbacks.onIniciarSegundoTempo);
  app.querySelector("#btnEncerrarPartida")?.addEventListener("click", callbacks.onEncerrarPartida);
  app.querySelector("#btnNovaPartida")?.addEventListener("click", callbacks.onNovaPartida);
  app.querySelector("#btnVerSumula")?.addEventListener("click", callbacks.onVerSumula);

  app.querySelectorAll("[data-abrir-painel]").forEach((btn) => {
    btn.addEventListener("click", () => callbacks.onAbrirPainel(btn.dataset.abrirPainel));
  });

  app.querySelector("[data-fechar-painel]")?.addEventListener("click", () => callbacks.onFecharPainel());

  app.querySelectorAll("[data-gol]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [timeId, jogadorId] = btn.dataset.gol.split(":");
      callbacks.onRegistrarGol(timeId, parseInt(jogadorId, 10));
    });
  });

  app.querySelectorAll("[data-sub-sai]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [timeId, jogadorId] = btn.dataset.subSai.split(":");
      callbacks.onSelecionarJogadorSai(timeId, parseInt(jogadorId, 10));
    });
  });

  app.querySelectorAll("[data-sub-entra]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [, jogadorId] = btn.dataset.subEntra.split(":");
      callbacks.onRegistrarSubstituicao(parseInt(jogadorId, 10));
    });
  });

  app.querySelectorAll("[data-remover-evento]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const eventoId = parseInt(btn.dataset.removerEvento, 10);
      const evento = partida.eventos.find((e) => e.id === eventoId);
      const mensagem = evento?.tipo === "substituicao" ? "Remover esta substituição da linha do tempo?" : "Remover este gol da linha do tempo?";
      if (!confirm(mensagem)) return;
      callbacks.onRemoverEvento(eventoId);
    });
  });

  app.querySelector("#btnVerEstatisticas").addEventListener("click", callbacks.onVerEstatisticas);
  app.querySelector("#btnEditarTimes").addEventListener("click", callbacks.onEditarTimes);
}

