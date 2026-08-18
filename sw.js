// Service worker do ApitoInicial: cache-first pros arquivos do próprio app, pra funcionar
// em campo mesmo sem internet depois da primeira visita. Sobe CACHE_NAME a cada mudança
// de arquivos estáticos pra forçar os clientes a buscar a versão nova.
const CACHE_NAME = "apitoinicial-v5";
const ARQUIVOS_ESSENCIAIS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./css/shoelace-tema.css",
  "./js/main.js",
  "./vendor/shoelace/shoelace-autoloader.js",
  "./vendor/shoelace/themes/light.css"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_ESSENCIAIS)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((chave) => chave !== CACHE_NAME).map((chave) => caches.delete(chave))))
  );
  self.clients.claim();
});

// Serve do cache quando disponível; senão busca na rede e guarda a resposta pra próxima vez.
// Requisições de outra origem (ex: fontes externas) passam direto, sem cache.
self.addEventListener("fetch", (evento) => {
  const url = new URL(evento.request.url);
  if (evento.request.method !== "GET" || url.origin !== self.location.origin) return;

  evento.respondWith(
    caches.match(evento.request).then((respostaCache) => {
      if (respostaCache) return respostaCache;
      return fetch(evento.request).then((respostaRede) => {
        const copia = respostaRede.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(evento.request, copia));
        return respostaRede;
      });
    })
  );
});
