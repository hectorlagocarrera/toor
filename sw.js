// Service worker mínimo: cachea la app (HTML/CSS/JS/iconos) y las respuestas de las APIs de
// datos (Open-Meteo y data/aemet.json) con estrategia "red primero, caché como reserva". Así la
// web carga al instante en visitas repetidas y sigue mostrando el último dato bueno sin cobertura
// (típico en la playa), sin dejar de pedir siempre lo más nuevo cuando hay conexión.
//
// Subir CACHE_NAME cada vez que cambien los archivos estáticos (a la vez que el ?v=N de
// index.html) para que las visitas ya instaladas descarten la caché vieja.
const CACHE_NAME = "meteocanteras-v28";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isOwnOrigin = url.origin === self.location.origin;
  const isWeatherApi = url.hostname === "api.open-meteo.com" || url.hostname === "marine-api.open-meteo.com";
  if (!isOwnOrigin && !isWeatherApi) return; // fuentes, Windy, etc.: fuera de la caché

  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}
