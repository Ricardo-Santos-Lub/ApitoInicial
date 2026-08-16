// Mantém a tela ligada enquanto a partida está em andamento (Wake Lock API), pra tela não
// apagar sozinha e o usuário perder de vista o cronômetro rodando. Sem suporte no navegador,
// falha em silêncio — só não impede a tela de apagar, não quebra o resto do app.

let wakeLockAtivo = null;

export async function manterTelaLigada() {
  if (!("wakeLock" in navigator) || wakeLockAtivo) return;
  try {
    wakeLockAtivo = await navigator.wakeLock.request("screen");
    wakeLockAtivo.addEventListener("release", () => {
      wakeLockAtivo = null;
    });
  } catch {
    wakeLockAtivo = null;
  }
}

export function liberarTelaLigada() {
  if (!wakeLockAtivo) return;
  wakeLockAtivo.release().catch(() => {});
  wakeLockAtivo = null;
}
