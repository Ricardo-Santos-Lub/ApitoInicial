import {
  criarPartidaVazia,
  definirFormato,
  definirDuracao,
  definirModoJogo,
  definirTime,
  definirTimeReserva,
  iniciarPartida,
  validarPartida,
  avancarSegundo,
  encerrarPrimeiroTempo,
  iniciarSegundoTempo,
  encerrarPartida
} from "./logica/partida.js";
import {
  adicionarJogadorPool,
  removerJogadorPool,
  atualizarNivelJogadorPool,
  alternarGoleiroPool
} from "./logica/jogadores.js";
import { sortearTimes } from "./logica/sorteio.js";
import { sortearTitularesTime } from "./logica/titulares.js";
import { registrarGol, registrarSubstituicao, removerEvento } from "./logica/eventos.js";
import { registrarPenaltis, iniciarProximaRodada } from "./logica/rodizio.js";
import { iniciarTrocaDupla } from "./logica/rodizioAmador.js";
import { salvar, carregar } from "./storage.js";
import { manterTelaLigada, liberarTelaLigada } from "./wakeLock.js";
import { renderTelaModo } from "./ui/telaModo.js";
import { renderTelaConfig, renderProximoJogo } from "./ui/telaConfig.js";
import { renderPlacar, atualizarRelogio } from "./ui/placar.js";
import { renderEstatisticas } from "./ui/estatisticas.js";
import { renderSumula } from "./ui/sumula.js";
import { ativarRipple } from "./ui/ripple.js";
import { iconeInicio } from "./ui/icones.js";

// O Shoelace usa uma classe pra alternar tema (não detecta prefers-color-scheme sozinho),
// então espelhamos aqui a mesma preferência que o resto do app já segue via @media.
const consultaTemaEscuro = window.matchMedia("(prefers-color-scheme: dark)");
const aplicarTemaShoelace = () => document.documentElement.classList.toggle("sl-theme-dark", consultaTemaEscuro.matches);
aplicarTemaShoelace();
consultaTemaEscuro.addEventListener("change", aplicarTemaShoelace);

let partida = carregar() || criarPartidaVazia();
let telaAtual = partida.status !== "nao_iniciada" ? "placar" : partida.modoJogo ? "config" : "modo";

// Estado de navegação — transiente, não faz parte dos dados da partida.
let painelAberto = null; // null | "gol" | "substituicao"
let jogadorSaiSelecionado = null; // { timeId, jogadorId } durante o fluxo de substituição
// Contagem dos pênaltis em andamento no modo rodízio — só vira estado da partida
// (partida.penaltis) quando confirmada, pra não travar o resultado a cada toque.
let penaltisTemp = { casa: 0, visitante: 0 };
// Se os times já têm nome, a pergunta de formato já foi respondida numa sessão anterior.
let formatoConfirmado = partida.times.casa.nome.trim() !== "" || partida.times.visitante.nome.trim() !== "" || partida.status !== "nao_iniciada";
// Id do jogador do pool cujo nível está sendo editado inline (toque no nome); null = nenhum
let editandoNivelPoolId = null;

function renderizar() {
  salvar(partida);

  if (partida.status === "em_andamento") {
    manterTelaLigada();
  } else {
    liberarTelaLigada();
  }

  if (telaAtual === "modo") {
    renderTelaModo(callbacksModo);
  } else if (telaAtual === "proximoJogo") {
    renderProximoJogo(partida, callbacksConfig);
  } else if (telaAtual === "config") {
    renderTelaConfig(partida, formatoConfirmado, editandoNivelPoolId, callbacksConfig);
  } else if (telaAtual === "estatisticas") {
    renderEstatisticas(partida, callbacksEstatisticas);
  } else if (telaAtual === "sumula") {
    renderSumula(partida, callbacksSumula);
  } else {
    renderPlacar(partida, { painelAberto, jogadorSaiSelecionado, penaltisTemp }, callbacksPlacar);
  }
}

const callbacksModo = {
  onEscolherModo: (modo) => {
    partida = definirModoJogo(partida, modo);
    telaAtual = "config";
    renderizar();
  }
};

const callbacksConfig = {
  onConfirmarFormato: (jogadoresPorTime, duracaoMinutos) => {
    partida = definirFormato(partida, jogadoresPorTime);
    partida = definirDuracao(partida, duracaoMinutos);
    formatoConfirmado = true;
    renderizar();
  },

  onAtualizarFormato: (valor) => {
    partida = definirFormato(partida, valor);
    renderizar();
  },

  onAtualizarDuracao: (valor) => {
    partida = definirDuracao(partida, valor);
    renderizar();
  },

  onAtualizarTime: (timeId, dados) => {
    partida = definirTime(partida, timeId, dados);
    salvar(partida); // sem re-render aqui pra não perder o foco do input
  },

  onAtualizarTimeReserva: (timeReservaId, dados) => {
    partida = definirTimeReserva(partida, timeReservaId, dados);
    salvar(partida); // sem re-render aqui pra não perder o foco do input
  },

  onAdicionarJogadorPool: (nome, nivel) => {
    partida = adicionarJogadorPool(partida, nome, nivel);
    renderizar();
  },

  onRemoverJogadorPool: (jogadorId) => {
    partida = removerJogadorPool(partida, jogadorId);
    renderizar();
  },

  onEditarNivelPool: (jogadorId) => {
    editandoNivelPoolId = jogadorId;
    renderizar();
  },

  onAtualizarNivelPool: (jogadorId, nivel) => {
    partida = atualizarNivelJogadorPool(partida, jogadorId, nivel);
    editandoNivelPoolId = null;
    renderizar();
  },

  onAlternarGoleiroPool: (jogadorId) => {
    partida = alternarGoleiroPool(partida, jogadorId);
    renderizar();
  },

  onSortear: () => {
    partida = sortearTimes(partida);
    renderizar();
  },

  onSortearTitulares: (timeId) => {
    partida = sortearTitularesTime(partida, timeId);
    renderizar();
  },

  onIniciar: () => {
    if (partida.status === "nao_iniciada") {
      const erro = validarPartida(partida);
      if (erro) {
        const msgErro = document.getElementById("msgErro");
        msgErro.textContent = erro;
        msgErro.classList.add("visivel");
        return;
      }
      partida = iniciarPartida(partida);
    }
    telaAtual = "placar";
    renderizar();
  }
};

const callbacksPlacar = {
  onEncerrarPrimeiroTempo: () => {
    partida = encerrarPrimeiroTempo(partida);
    renderizar();
  },

  onIniciarSegundoTempo: () => {
    partida = iniciarSegundoTempo(partida);
    renderizar();
  },

  onEncerrarPartida: () => {
    partida = encerrarPartida(partida);
    renderizar();
  },

  onAbrirPainel: (tipo) => {
    painelAberto = tipo;
    jogadorSaiSelecionado = null;
    renderizar();
  },

  onFecharPainel: () => {
    painelAberto = null;
    jogadorSaiSelecionado = null;
    renderizar();
  },

  onRegistrarGol: (timeId, jogadorId) => {
    partida = registrarGol(partida, timeId, jogadorId);
    painelAberto = null;
    renderizar();
  },

  onSelecionarJogadorSai: (timeId, jogadorId) => {
    jogadorSaiSelecionado = { timeId, jogadorId };
    renderizar();
  },

  onRegistrarSubstituicao: (jogadorEntraId) => {
    if (!jogadorSaiSelecionado) return;
    partida = registrarSubstituicao(partida, jogadorSaiSelecionado.timeId, jogadorSaiSelecionado.jogadorId, jogadorEntraId);
    painelAberto = null;
    jogadorSaiSelecionado = null;
    renderizar();
  },

  onRemoverEvento: (eventoId) => {
    partida = removerEvento(partida, eventoId);
    renderizar();
  },

  onEditarTimes: () => {
    telaAtual = "config";
    painelAberto = null;
    jogadorSaiSelecionado = null;
    renderizar();
  },

  onVerEstatisticas: () => {
    telaAtual = "estatisticas";
    renderizar();
  },

  onNovaPartida: () => {
    reiniciarApp();
  },

  onVerSumula: () => {
    telaAtual = "sumula";
    renderizar();
  },

  // ===== Modo rodízio (vencedor fica, perdedor sai pra fila) =====

  onRegistrarPenalti: (timeId) => {
    penaltisTemp = { ...penaltisTemp, [timeId]: penaltisTemp[timeId] + 1 };
    renderizar();
  },

  onZerarPenaltis: () => {
    penaltisTemp = { casa: 0, visitante: 0 };
    renderizar();
  },

  onConfirmarPenaltis: () => {
    partida = registrarPenaltis(partida, penaltisTemp.casa, penaltisTemp.visitante);
    penaltisTemp = { casa: 0, visitante: 0 };
    renderizar();
  },

  onIniciarProximaRodada: (timeReservaId) => {
    partida = iniciarProximaRodada(partida, timeReservaId);
    penaltisTemp = { casa: 0, visitante: 0 };
    telaAtual = "proximoJogo"; // times já vêm prontos da rotação, só confirma e inicia
    renderizar();
  },

  // ===== Modo amador: empate com fila de 2+ times troca os 2 times de uma vez =====

  onIniciarTrocaDupla: () => {
    partida = iniciarTrocaDupla(partida);
    penaltisTemp = { casa: 0, visitante: 0 };
    telaAtual = "proximoJogo";
    renderizar();
  }
};

const callbacksEstatisticas = {
  onVoltar: () => {
    telaAtual = "placar";
    renderizar();
  }
};

const callbacksSumula = {
  onVoltar: () => {
    telaAtual = "placar";
    renderizar();
  }
};

function reiniciarApp() {
  partida = criarPartidaVazia();
  telaAtual = "modo";
  formatoConfirmado = false;
  painelAberto = null;
  jogadorSaiSelecionado = null;
  penaltisTemp = { casa: 0, visitante: 0 };
  editandoNivelPoolId = null;
  renderizar();
}

// Botão do cabeçalho: fica fora do #app (não é redesenhado a cada tela), então é ligado
// uma única vez aqui. Pede confirmação porque, diferente do "Nova Partida" (só aparece
// com o jogo já encerrado), esse botão fica acessível o tempo todo, inclusive ao vivo.
const btnVoltarInicio = document.getElementById("btnVoltarInicio");
btnVoltarInicio.innerHTML = iconeInicio;
ativarRipple(document.querySelector(".app-header"));
btnVoltarInicio.addEventListener("click", () => {
  if (!confirm("Voltar para o início? A partida atual (times, placar e eventos) será apagada.")) return;
  reiniciarApp();
});

renderizar();

// Cronômetro correndo sozinho enquanto a partida está em andamento. Atualiza só o
// texto do relógio (não a tela inteira) pra não atrapalhar quem estiver digitando
// no campo de correção de minuto.
setInterval(() => {
  const nova = avancarSegundo(partida);
  if (nova === partida) return;
  partida = nova;
  salvar(partida);
  atualizarRelogio(partida);
}, 1000);

// A Wake Lock é liberada automaticamente pelo navegador quando a aba perde
// visibilidade (troca de app, tela bloqueada) — precisa reativar ao voltar.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && partida.status === "em_andamento") {
    manterTelaLigada();
  }
});
