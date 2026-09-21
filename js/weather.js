function buildUrl(base, params) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => usp.set(key, value));
  return `${base}?${usp.toString()}`;
}

// Tabla de códigos WMO usada por Open-Meteo (weather_code).
const WEATHER_CODE_MAP = {
  es: {
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
  },
  en: {
    0: "Clear sky",
    1: "Mostly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Freezing fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Light rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Light snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Light showers",
    81: "Moderate showers",
    82: "Violent showers",
    85: "Light snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with light hail",
    99: "Thunderstorm with heavy hail",
  },
};

function weatherCodeToText(code) {
  const dict = WEATHER_CODE_MAP[getLang()] || WEATHER_CODE_MAP.es;
  return dict[code] ?? "—";
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
  if (uv < 3) return t("uv.bajo");
  if (uv < 6) return t("uv.moderado");
  if (uv < 8) return t("uv.alto");
  if (uv < 11) return t("uv.muyAlto");
  return t("uv.extremo");
}

function formatHour(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" });
}

function formatDayName(isoString) {
  const d = new Date(isoString + "T12:00:00");
  return d.toLocaleDateString(getLocale(), { weekday: "short", day: "numeric", month: "short" });
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
