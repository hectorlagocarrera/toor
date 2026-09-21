function buildUrl(base, params) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => usp.set(key, value));
  return `${base}?${usp.toString()}`;
}

// Tabla de códigos WMO usada por Open-Meteo (weather_code).
const WEATHER_CODE_MAP = {
  0: "Cielo despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Cubierto",
  45: "Niebla",
  48: "Niebla helada",
  51: "Llovizna débil",
  53: "Llovizna moderada",
  55: "Llovizna intensa",
  56: "Llovizna helada débil",
  57: "Llovizna helada intensa",
  61: "Lluvia débil",
  63: "Lluvia moderada",
  65: "Lluvia intensa",
  66: "Lluvia helada débil",
  67: "Lluvia helada intensa",
  71: "Nevada débil",
  73: "Nevada moderada",
  75: "Nevada intensa",
  77: "Granos de nieve",
  80: "Chubascos débiles",
  81: "Chubascos moderados",
  82: "Chubascos violentos",
  85: "Chubascos de nieve débiles",
  86: "Chubascos de nieve intensos",
  95: "Tormenta",
  96: "Tormenta con granizo débil",
  99: "Tormenta con granizo fuerte",
};

function weatherCodeToText(code) {
  return WEATHER_CODE_MAP[code] ?? "—";
}

const COMPASS_POINTS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

function degreesToCompass(deg) {
  if (deg === null || deg === undefined || Number.isNaN(deg)) return "--";
  const idx = Math.round(deg / 22.5) % 16;
  return COMPASS_POINTS[idx];
}

function uvIndexLabel(uv) {
  if (uv === null || uv === undefined || Number.isNaN(uv)) return "—";
  if (uv < 3) return "Bajo";
  if (uv < 6) return "Moderado";
  if (uv < 8) return "Alto";
  if (uv < 11) return "Muy alto";
  return "Extremo";
}

function formatHour(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function formatDayName(isoString) {
  const d = new Date(isoString + "T12:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

// Bandas de color al estilo Windguru: de un vistazo, sin tener que leer cada número.
function windBand(speedKmh) {
  if (speedKmh === null || speedKmh === undefined) return null;
  if (speedKmh < 10) return 0;
  if (speedKmh < 20) return 1;
  if (speedKmh < 29) return 2;
  if (speedKmh < 39) return 3;
  return 4;
}

function waveBand(heightM) {
  if (heightM === null || heightM === undefined) return null;
  if (heightM < 0.5) return 0;
  if (heightM < 1) return 1;
  if (heightM < 2) return 2;
  if (heightM < 3) return 3;
  return 4;
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} al consultar ${url}`);
  return res.json();
}

async function fetchWeatherData() {
  const forecastUrl = buildUrl(FORECAST_URL, FORECAST_PARAMS);
  const marineUrl = buildUrl(MARINE_URL, MARINE_PARAMS);

  const [forecastResult, marineResult] = await Promise.allSettled([
    fetchJson(forecastUrl),
    fetchJson(marineUrl),
  ]);

  if (forecastResult.status === "rejected") {
    throw forecastResult.reason;
  }

  return {
    forecast: forecastResult.value,
    marine: marineResult.status === "fulfilled" ? marineResult.value : null,
    marineError: marineResult.status === "rejected" ? marineResult.reason : null,
  };
}
