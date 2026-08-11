// Camada de UI: lê o estado da partida e desenha a tela.
// Só este tipo de arquivo pode tocar em document.*.

import { ativarRipple } from "./ripple.js";

export function renderTelaConfig(partida, formatoConfirmado, callbacks) {
  const app = document.getElementById("app");
  app.classList.remove("tem-nav-inferior");

  if (!formatoConfirmado) {
    app.innerHTML = renderPerguntaFormato(partida);
    app.querySelector("#btnConfirmarFormato").addEventListener("click", () => {
      const valor = parseInt(app.querySelector("#jogadoresPorTimeInicial").value, 10) || 1;
      callbacks.onConfirmarFormato(valor);
    });
    ativarRipple(app);
    return;
  }

  const jaComecou = partida.status !== "nao_iniciada";

  app.innerHTML = `
    <section class="card">
      <h2>Formato da partida</h2>
      <div class="campo">
        <label for="jogadoresPorTime">Jogadores por time (em campo)</label>
        <input type="number" id="jogadoresPorTime" min="1" max="11" value="${partida.formato.jogadoresPorTime}">
      </div>
    </section>

    <div class="segmented">
      <button class="ripple ${partida.modoFormacao === "manual" ? "ativo" : ""}" id="btnModoManual">Cadastro manual</button>
      <button class="ripple ${partida.modoFormacao === "sorteio" ? "ativo" : ""}" id="btnModoSorteio">Sortear times</button>
    </div>

    ${partida.modoFormacao === "manual" ? renderModoManual(partida) : renderModoSorteio(partida)}

    <div class="botao-principal-wrap">
      <p class="erro" id="msgErro"></p>
      <button class="botao ripple" id="btnIniciar">${jaComecou ? "Voltar para o jogo" : "Iniciar Partida"}</button>
    </div>
  `;

  vincularEventos(app, partida, callbacks);
  ativarRipple(app);
}

function renderPerguntaFormato(partida) {
  return `
    <section class="card">
      <h2>Quantos jogadores vão jogar essa partida?</h2>
      <p class="contador-jogadores">
        Define quantos titulares cada time tem em campo ao mesmo tempo. Pode ser diferente a cada partida.
      </p>
      <div class="campo">
        <label for="jogadoresPorTimeInicial">Jogadores por time (em campo)</label>
        <input type="number" id="jogadoresPorTimeInicial" min="1" max="11" value="${partida.formato.jogadoresPorTime}">
      </div>
    </section>

    <div class="botao-principal-wrap">
      <button class="botao ripple" id="btnConfirmarFormato">Continuar</button>
    </div>
  `;
}

function renderModoManual(partida) {
  return `
    <section class="times-grid">
      ${renderTimeCard(partida, "casa", "Time da Casa")}
      ${renderTimeCard(partida, "visitante", "Time Visitante")}
    </section>
  `;
}

function renderTimeCard(partida, timeId, titulo) {
  const time = partida.times[timeId];

  return `
    <div class="card time-card" style="--cor-time:${time.cor}">
      <h2>${titulo}</h2>
      <div class="campo">
        <label for="nome-${timeId}">Nome do time</label>
        <input type="text" id="nome-${timeId}" value="${escapeHtml(time.nome)}" placeholder="Ex: Real Matismo">
      </div>
      <div class="campo">
        <label for="cor-${timeId}">Cor</label>
        <input type="color" id="cor-${timeId}" value="${time.cor}">
      </div>

      <div class="campo">
        ${renderListasTitularesReservas(partida, timeId, { removivel: true })}
        <div class="add-jogador-form">
          <input type="text" placeholder="Nome do jogador" id="novoNome-${timeId}">
          <input type="number" placeholder="Nº" id="novoNumero-${timeId}" min="1" max="99">
          <button class="botao pequeno ripple" data-adicionar="${timeId}">Adicionar</button>
        </div>
      </div>
    </div>
  `;
}

function renderModoSorteio(partida) {
  return `
    <section class="times-grid">
      ${renderCabecalhoTime(partida, "casa", "Time da Casa")}
      ${renderCabecalhoTime(partida, "visitante", "Time Visitante")}
    </section>

    <section class="card">
      <h2>Jogadores para sortear</h2>
      <p class="contador-jogadores">${partida.poolJogadores.length} jogador(es) cadastrado(s)</p>
      <ul class="lista-jogadores">${renderListaPool(partida)}</ul>
      <div class="add-jogador-form">
        <input type="text" placeholder="Nome do jogador" id="novoNomePool">
        <select id="novoNivelPool" class="select-nivel">
          <option value="1">Nível 1</option>
          <option value="2">Nível 2</option>
          <option value="3" selected>Nível 3</option>
          <option value="4">Nível 4</option>
          <option value="5">Nível 5</option>
        </select>
        <button class="botao pequeno ripple" id="btnAdicionarPool">Adicionar</button>
      </div>
      <button class="botao ripple" id="btnSortear" ${partida.poolJogadores.length < 2 ? "disabled" : ""}>
        ${jaSorteado(partida) ? "Sortear novamente" : "Sortear Times"}
      </button>
    </section>
  `;
}

function renderCabecalhoTime(partida, timeId, titulo) {
  const time = partida.times[timeId];

  const conteudoRoster = time.jogadores.length
    ? renderListasTitularesReservas(partida, timeId, { removivel: false })
    : `<p class="contador-jogadores">Aguardando sorteio</p><ul class="lista-jogadores"><li class="lista-vazia">Aguardando sorteio</li></ul>`;

  return `
    <div class="card time-card" style="--cor-time:${time.cor}">
      <h2>${titulo}</h2>
      <div class="campo">
        <label for="nome-${timeId}">Nome do time</label>
        <input type="text" id="nome-${timeId}" value="${escapeHtml(time.nome)}" placeholder="Ex: Real Matismo">
      </div>
      <div class="campo">
        <label for="cor-${timeId}">Cor</label>
        <input type="color" id="cor-${timeId}" value="${time.cor}">
      </div>
      <div class="campo">${conteudoRoster}</div>
    </div>
  `;
}

// Lista "Em campo" + "Reserva" de um time, com sorteio de titulares quando há gente sobrando.
function renderListasTitularesReservas(partida, timeId, { removivel }) {
  const time = partida.times[timeId];
  const limite = partida.formato.jogadoresPorTime;
  const titulares = time.jogadores.filter((j) => j.titular);
  const reservas = time.jogadores.filter((j) => !j.titular);

  const itemHtml = (j) => `
    <li>
      <span>${rotuloJogador(j)}</span>
      ${removivel ? `<button class="ripple" data-remover="${timeId}:${j.id}" title="Remover jogador">✕</button>` : ""}
    </li>`;

  const listaTitularesHtml = titulares.length
    ? titulares.map(itemHtml).join("")
    : `<li class="lista-vazia">Ninguém em campo ainda</li>`;

  const precisaSorteio = time.jogadores.length > limite;

  return `
    <p class="contador-jogadores ${titulares.length > limite ? "contador-excesso" : ""}">Em campo (${titulares.length}/${limite})</p>
    <ul class="lista-jogadores">${listaTitularesHtml}</ul>
    ${
      reservas.length
        ? `<p class="contador-jogadores">Reserva (${reservas.length})</p><ul class="lista-jogadores">${reservas.map(itemHtml).join("")}</ul>`
        : ""
    }
    ${precisaSorteio ? `<button class="botao-pill-outline ripple" data-sortear-titulares="${timeId}">Sortear titulares</button>` : ""}
  `;
}

function renderListaPool(partida) {
  if (!partida.poolJogadores.length) {
    return `<li class="lista-vazia">Nenhum jogador cadastrado</li>`;
  }
  return partida.poolJogadores
    .map(
      (j) => `
      <li>
        <span>${escapeHtml(j.nome)} <span class="nivel-tag">nível ${j.nivel}</span></span>
        <button class="ripple" data-remover-pool="${j.id}" title="Remover jogador">✕</button>
      </li>`
    )
    .join("");
}

function rotuloJogador(jogador) {
  if (jogador.numero) return `<span class="badge-numero">${jogador.numero}</span> ${escapeHtml(jogador.nome)}`;
  if (jogador.nivel) return `${escapeHtml(jogador.nome)} <span class="nivel-tag">nível ${jogador.nivel}</span>`;
  return escapeHtml(jogador.nome);
}

function jaSorteado(partida) {
  return partida.times.casa.jogadores.length > 0 || partida.times.visitante.jogadores.length > 0;
}

function vincularEventos(app, partida, callbacks) {
  app.querySelector("#jogadoresPorTime").addEventListener("change", (e) => {
    const valor = parseInt(e.target.value, 10) || 1;
    callbacks.onAtualizarFormato(valor);
  });

  app.querySelector("#btnModoManual").addEventListener("click", () => callbacks.onMudarModo("manual"));
  app.querySelector("#btnModoSorteio").addEventListener("click", () => callbacks.onMudarModo("sorteio"));

  ["casa", "visitante"].forEach((timeId) => {
    app.querySelector(`#nome-${timeId}`).addEventListener("input", (e) => {
      callbacks.onAtualizarTime(timeId, { nome: e.target.value });
    });

    app.querySelector(`#cor-${timeId}`).addEventListener("input", (e) => {
      callbacks.onAtualizarTime(timeId, { cor: e.target.value });
      e.target.closest(".time-card").style.setProperty("--cor-time", e.target.value);
    });

    app.querySelector(`[data-adicionar="${timeId}"]`)?.addEventListener("click", () => {
      const nomeInput = app.querySelector(`#novoNome-${timeId}`);
      const numeroInput = app.querySelector(`#novoNumero-${timeId}`);
      const nome = nomeInput.value.trim();
      const numero = parseInt(numeroInput.value, 10);
      if (!nome || !numero) return;
      callbacks.onAdicionarJogador(timeId, nome, numero);
    });
  });

  app.querySelectorAll("[data-remover]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [timeId, jogadorId] = btn.dataset.remover.split(":");
      callbacks.onRemoverJogador(timeId, parseInt(jogadorId, 10));
    });
  });

  app.querySelectorAll("[data-sortear-titulares]").forEach((btn) => {
    btn.addEventListener("click", () => callbacks.onSortearTitulares(btn.dataset.sortearTitulares));
  });

  app.querySelector("#btnAdicionarPool")?.addEventListener("click", () => {
    const nomeInput = app.querySelector("#novoNomePool");
    const nivelInput = app.querySelector("#novoNivelPool");
    const nome = nomeInput.value.trim();
    const nivel = parseInt(nivelInput.value, 10);
    if (!nome) return;
    callbacks.onAdicionarJogadorPool(nome, nivel);
  });

  app.querySelectorAll("[data-remover-pool]").forEach((btn) => {
    btn.addEventListener("click", () => {
      callbacks.onRemoverJogadorPool(parseInt(btn.dataset.removerPool, 10));
    });
  });

  app.querySelector("#btnSortear")?.addEventListener("click", () => callbacks.onSortear());

  app.querySelector("#btnIniciar").addEventListener("click", () => {
    callbacks.onIniciar();
  });
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
