// Utilitário de UI compartilhado entre as telas.

export function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
