// Efeito ripple (Material Design). Camada de UI pura — sem lógica de negócio.

export function ativarRipple(container) {
  container.querySelectorAll(".ripple").forEach((el) => {
    if (el.dataset.rippleVinculado) return;
    el.dataset.rippleVinculado = "1";
    el.addEventListener("pointerdown", criarRipple);
  });
}

function criarRipple(evento) {
  const el = evento.currentTarget;
  if (el.disabled) return;

  const rect = el.getBoundingClientRect();
  const diametro = Math.max(rect.width, rect.height) * 2;
  const raio = diametro / 2;

  const span = document.createElement("span");
  span.className = "ripple-efeito";
  span.style.width = `${diametro}px`;
  span.style.height = `${diametro}px`;
  span.style.left = `${evento.clientX - rect.left - raio}px`;
  span.style.top = `${evento.clientY - rect.top - raio}px`;

  el.appendChild(span);
  span.addEventListener("animationend", () => span.remove());
}
