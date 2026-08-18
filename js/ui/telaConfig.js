// Camada de UI: lê o estado da partida e desenha a tela.
// Só este tipo de arquivo pode tocar em document.*.
// Usa os web components do Shoelace (vendor/shoelace) pros controles de formulário.

import { escapeHtml, rotuloJogador } from "./dom.js";

export function renderTelaConfig(partida, formatoConfirmado, editandoNivelPoolId, callbacks) {
  const app = document.getElementById("app");
  app.classList.remove("tem-nav-inferior");

  if (!formatoConfirmado) {
    app.innerHTML = renderPerguntaFormato(partida);
    app.querySelector("#btnConfirmarFormato").addEventListener("click", () => {
      const jogadoresPorTime = parseInt(app.querySelector("#jogadoresPorTimeInicial").value, 10);
      const duracaoMinutos = parseInt(app.querySelector("#duracaoInicial").value, 10);
      const msgErro = app.querySelector("#msgErroFormato");

      if (!jogadoresPorTime || !duracaoMinutos) {
        msgErro.textContent = "Preencha os jogadores por time e a duração de cada tempo.";
        msgErro.classList.add("visivel");
        return;
      }

      callbacks.onConfirmarFormato(jogadoresPorTime, duracaoMinutos);
    });
    return;
  }

  const jaComecou = partida.status !== "nao_iniciada";

  app.innerHTML = `
    <sl-card class="card">
      <h2>Formato da partida</h2>
      <div class="campo">
        <label for="jogadoresPorTime">Jogadores por time (em campo)</label>
        <sl-input type="number" id="jogadoresPorTime" min="1" max="11" value="${partida.formato.jogadoresPorTime}"></sl-input>
      </div>
      <div class="campo">
        <label for="duracaoTempo">Duração de cada tempo (minutos)</label>
        <sl-input type="number" id="duracaoTempo" min="1" max="90" value="${partida.formato.duracaoMinutos ?? 20}" ${jaComecou ? "disabled" : ""}></sl-input>
      </div>
    </sl-card>

    ${renderModoSorteio(partida, editandoNivelPoolId)}

    <div class="botao-principal-wrap">
      <p class="erro" id="msgErro"></p>
      <sl-button id="btnIniciar" variant="primary" size="large" pill class="botao-full">${jaComecou ? "Voltar para o jogo" : "Iniciar Partida"}</sl-button>
    </div>
  `;

  vincularEventos(app, partida, callbacks);
}

function renderPerguntaFormato(partida) {
  return `
    <sl-card class="card">
      <h2>Quantos jogadores vão jogar essa partida?</h2>
      <p class="contador-jogadores">
        Define quantos titulares cada time tem em campo ao mesmo tempo. Pode ser diferente a cada partida.
      </p>
      <div class="campo">
        <label for="jogadoresPorTimeInicial">Jogadores por time (em campo)</label>
        <sl-input type="number" id="jogadoresPorTimeInicial" min="1" max="11" placeholder="Ex: 10"></sl-input>
      </div>
      <div class="campo">
        <label for="duracaoInicial">Duração de cada tempo (minutos)</label>
        <sl-input type="number" id="duracaoInicial" min="1" max="90" placeholder="Ex: 20"></sl-input>
      </div>
    </sl-card>

    <div class="botao-principal-wrap">
      <p class="erro" id="msgErroFormato"></p>
      <sl-button id="btnConfirmarFormato" variant="primary" size="large" pill class="botao-full">Continuar</sl-button>
    </div>
  `;
}

function renderModoSorteio(partida, editandoNivelPoolId) {
  return `
    <section class="times-grid">
      ${renderCabecalhoTime(partida, "casa", "Time da Casa")}
      ${renderCabecalhoTime(partida, "visitante", "Time Visitante")}
    </section>

    ${partida.filaReserva.length ? renderFilaReserva(partida) : ""}

    <sl-card class="card">
      <h2>Jogadores para sortear</h2>
      <p class="contador-jogadores">${partida.poolJogadores.length} jogador(es) cadastrado(s)</p>
      <ul class="lista-jogadores">${renderListaPool(partida, editandoNivelPoolId)}</ul>
      <div class="add-jogador-form">
        <sl-input type="text" placeholder="Nome do jogador" id="novoNomePool"></sl-input>
        <sl-select id="novoNivelPool" value="3" class="select-nivel">
          <sl-option value="1">Nível 1</sl-option>
          <sl-option value="2">Nível 2</sl-option>
          <sl-option value="3">Nível 3</sl-option>
          <sl-option value="4">Nível 4</sl-option>
          <sl-option value="5">Nível 5</sl-option>
        </sl-select>
        <sl-button size="small" pill variant="primary" outline id="btnAdicionarPool">Adicionar</sl-button>
      </div>
      <sl-button id="btnSortear" variant="primary" size="large" pill class="botao-full" ${partida.poolJogadores.length < 2 ? "disabled" : ""}>
        ${jaSorteado(partida) ? "Sortear novamente" : "Sortear Times"}
      </sl-button>
    </sl-card>
  `;
}

function renderCabecalhoTime(partida, timeId, titulo) {
  const time = partida.times[timeId];

  const conteudoRoster = time.jogadores.length
    ? renderListasTitularesReservas(partida, timeId)
    : `<p class="contador-jogadores">Aguardando sorteio</p><ul class="lista-jogadores"><li class="lista-vazia">Aguardando sorteio</li></ul>`;

  return `
    <sl-card class="card time-card" style="--cor-time:${time.cor}">
      <h2>${titulo}</h2>
      <div class="campo">
        <label for="nome-${timeId}">Nome do time</label>
        <sl-input type="text" id="nome-${timeId}" value="${escapeHtml(time.nome)}" placeholder="Ex: Real Matismo"></sl-input>
      </div>
      <div class="campo">
        <label for="cor-${timeId}">Cor</label>
        <input type="color" id="cor-${timeId}" value="${time.cor}">
      </div>
      <div class="campo">${conteudoRoster}</div>
    </sl-card>
  `;
}

// Jogadores suficientes pro sorteio formar 3+ times: os times além dos 2 que entram em
// campo ficam aqui, esperando pra substituir quem perder (ver logica/rodizio.js).
function renderFilaReserva(partida) {
  return `
    <sl-card class="card">
      <h2>Times na fila de espera</h2>
      <p class="contador-jogadores">Entram no lugar de quem perder, depois que a partida atual terminar.</p>
    </sl-card>
    <section class="times-grid">
      ${partida.filaReserva.map((time) => renderTimeReservaCard(partida, time)).join("")}
    </section>
  `;
}

function renderTimeReservaCard(partida, time) {
  const limite = partida.formato.jogadoresPorTime;
  const titulares = time.jogadores.filter((j) => j.titular);
  const reservas = time.jogadores.filter((j) => !j.titular);
  const itemHtml = (j) => `<li><span>${rotuloJogador(j)}</span></li>`;

  return `
    <sl-card class="card time-card" style="--cor-time:${time.cor}">
      <h2>${escapeHtml(time.nome)}</h2>
      <div class="campo">
        <label for="nome-reserva-${time.id}">Nome do time</label>
        <sl-input type="text" id="nome-reserva-${time.id}" value="${escapeHtml(time.nome)}" placeholder="Ex: Real Matismo"></sl-input>
      </div>
      <div class="campo">
        <label for="cor-reserva-${time.id}">Cor</label>
        <input type="color" id="cor-reserva-${time.id}" value="${time.cor}">
      </div>
      <div class="campo">
        <p class="contador-jogadores">Em campo (${titulares.length}/${limite})</p>
        <ul class="lista-jogadores">${titulares.length ? titulares.map(itemHtml).join("") : `<li class="lista-vazia">Ninguém em campo ainda</li>`}</ul>
        ${
          reservas.length
            ? `<p class="contador-jogadores">Reserva (${reservas.length})</p><ul class="lista-jogadores">${reservas.map(itemHtml).join("")}</ul>`
            : ""
        }
      </div>
    </sl-card>
  `;
}

// Lista "Em campo" + "Reserva" de um time, com sorteio de titulares quando há gente sobrando.
function renderListasTitularesReservas(partida, timeId) {
  const time = partida.times[timeId];
  const limite = partida.formato.jogadoresPorTime;
  const titulares = time.jogadores.filter((j) => j.titular);
  const reservas = time.jogadores.filter((j) => !j.titular);

  const itemHtml = (j) => `<li><span>${rotuloJogador(j)}</span></li>`;

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
    ${precisaSorteio ? `<sl-button class="botao-full" variant="primary" outline size="small" pill data-sortear-titulares="${timeId}">Sortear titulares</sl-button>` : ""}
  `;
}

function renderListaPool(partida, editandoNivelPoolId) {
  if (!partida.poolJogadores.length) {
    return `<li class="lista-vazia">Nenhum jogador cadastrado</li>`;
  }
  return partida.poolJogadores.map((j) => renderItemPool(j, editandoNivelPoolId)).join("");
}

// Toque no nome entra em modo de edição do nível, trocando a tag de texto por um sl-select.
function renderItemPool(jogador, editandoNivelPoolId) {
  const editando = jogador.id === editandoNivelPoolId;

  const nomeHtml = editando
    ? `<span class="nome-jogador-pool">${escapeHtml(jogador.nome)}</span>`
    : `<span class="nome-jogador-pool" data-tocar-nivel="${jogador.id}">${rotuloJogador(jogador)}</span>`;

  const selectHtml = editando
    ? `<sl-select value="${jogador.nivel}" size="small" class="select-nivel-inline" data-editar-nivel="${jogador.id}">
          <sl-option value="1">Nível 1</sl-option>
          <sl-option value="2">Nível 2</sl-option>
          <sl-option value="3">Nível 3</sl-option>
          <sl-option value="4">Nível 4</sl-option>
          <sl-option value="5">Nível 5</sl-option>
        </sl-select>`
    : "";

  return `
      <li>
        ${nomeHtml}
        <span class="pool-item-controles">
          ${selectHtml}
          <button
            type="button"
            class="toggle-goleiro ${jogador.goleiro ? "ativo" : ""}"
            data-toggle-goleiro="${jogador.id}"
            aria-pressed="${jogador.goleiro}"
            title="${jogador.goleiro ? "Desmarcar como goleiro" : "Marcar como goleiro"}"
          >🧤</button>
          <sl-icon-button name="x-lg" label="Remover jogador" data-remover-pool="${jogador.id}"></sl-icon-button>
        </span>
      </li>`;
}

function jaSorteado(partida) {
  return partida.times.casa.jogadores.length > 0 || partida.times.visitante.jogadores.length > 0;
}

function vincularEventos(app, partida, callbacks) {
  app.querySelector("#jogadoresPorTime").addEventListener("sl-change", (e) => {
    const valor = parseInt(e.target.value, 10) || 1;
    callbacks.onAtualizarFormato(valor);
  });

  app.querySelector("#duracaoTempo")?.addEventListener("sl-change", (e) => {
    const valor = parseInt(e.target.value, 10) || 1;
    callbacks.onAtualizarDuracao(valor);
  });

  ["casa", "visitante"].forEach((timeId) => {
    app.querySelector(`#nome-${timeId}`).addEventListener("sl-input", (e) => {
      callbacks.onAtualizarTime(timeId, { nome: e.target.value });
    });

    app.querySelector(`#cor-${timeId}`).addEventListener("input", (e) => {
      callbacks.onAtualizarTime(timeId, { cor: e.target.value });
      e.target.closest(".time-card").style.setProperty("--cor-time", e.target.value);
    });
  });

  partida.filaReserva.forEach((time) => {
    app.querySelector(`#nome-reserva-${time.id}`)?.addEventListener("sl-input", (e) => {
      callbacks.onAtualizarTimeReserva(time.id, { nome: e.target.value });
    });

    app.querySelector(`#cor-reserva-${time.id}`)?.addEventListener("input", (e) => {
      callbacks.onAtualizarTimeReserva(time.id, { cor: e.target.value });
      e.target.closest(".time-card").style.setProperty("--cor-time", e.target.value);
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

  app.querySelectorAll("[data-tocar-nivel]").forEach((span) => {
    span.addEventListener("click", () => {
      callbacks.onEditarNivelPool(parseInt(span.dataset.tocarNivel, 10));
    });
  });

  app.querySelectorAll("[data-toggle-goleiro]").forEach((btn) => {
    btn.addEventListener("click", () => {
      callbacks.onAlternarGoleiroPool(parseInt(btn.dataset.toggleGoleiro, 10));
    });
  });

  const selectNivelEmEdicao = app.querySelector("[data-editar-nivel]");
  if (selectNivelEmEdicao) {
    const jogadorId = parseInt(selectNivelEmEdicao.dataset.editarNivel, 10);
    let nivelConfirmado = false;

    selectNivelEmEdicao.addEventListener("sl-change", (e) => {
      nivelConfirmado = true;
      callbacks.onAtualizarNivelPool(jogadorId, parseInt(e.target.value, 10));
    });

    // Tocar fora sem escolher um nível novo só fecha a edição, sem salvar nada.
    // O adiamento é necessário porque, ao escolher uma opção, o componente dispara
    // "sl-blur" praticamente junto com "sl-change" — sem o setTimeout, o blur às vezes
    // chega primeiro e fecha a edição antes do valor novo ser salvo.
    selectNivelEmEdicao.addEventListener("sl-blur", () => {
      setTimeout(() => {
        if (nivelConfirmado) return;
        callbacks.onEditarNivelPool(null);
      }, 0);
    });

    // Espera o componente terminar de montar antes de abrir o dropdown,
    // senão o show() cedo demais não tem efeito em alguns navegadores/dispositivos.
    Promise.resolve(selectNivelEmEdicao.updateComplete).then(() => selectNivelEmEdicao.show?.());
  }

  app.querySelector("#btnSortear")?.addEventListener("click", () => callbacks.onSortear());

  app.querySelector("#btnIniciar").addEventListener("click", () => {
    callbacks.onIniciar();
  });
}
