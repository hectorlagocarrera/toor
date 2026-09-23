// Punto de referencia sobre el paseo de Las Canteras (zona La Cícer / centro de la playa).
const BEACH_LOCATION = {
  name: "Playa de Las Canteras",
  latitude: 28.1466,
  longitude: -15.4325,
};

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";

const FORECAST_PARAMS = {
  latitude: BEACH_LOCATION.latitude,
  longitude: BEACH_LOCATION.longitude,
  current: [
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "precipitation",
    "weather_code",
    "cloud_cover",
    "wind_speed_10m",
    "wind_direction_10m",
    "wind_gusts_10m",
    "uv_index",
    "visibility",
  ].join(","),
  hourly: [
    "temperature_2m",
    "precipitation_probability",
    "weather_code",
    "wind_speed_10m",
    "wind_direction_10m",
    "wind_gusts_10m",
    "uv_index",
  ].join(","),
  daily: [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "uv_index_max",
    "wind_speed_10m_max",
    "wind_gusts_10m_max",
    "wind_direction_10m_dominant",
    "precipitation_probability_max",
    "sunrise",
    "sunset",
  ].join(","),
  timezone: "Atlantic/Canary",
  forecast_days: 7,
  wind_speed_unit: "kmh",
};

const MARINE_PARAMS = {
  latitude: BEACH_LOCATION.latitude,
  longitude: BEACH_LOCATION.longitude,
  current: [
    "wave_height",
    "wave_direction",
    "wave_period",
    "wind_wave_height",
    "wind_wave_period",
    "swell_wave_height",
    "swell_wave_period",
    "swell_wave_direction",
    "sea_surface_temperature",
    "sea_level_height_msl",
  ].join(","),
  hourly: [
    "wave_height",
    "wave_period",
    "wave_direction",
    "swell_wave_height",
    "swell_wave_period",
    "sea_surface_temperature",
    "sea_level_height_msl",
  ].join(","),
  timezone: "Atlantic/Canary",
  forecast_days: 7,
  // Las Canteras está muy pegada a la costa: sin esto, la API puede coger una celda de rejilla
  // de "tierra" para este punto y devolver null en variables marinas (incluida la marea).
  cell_selection: "sea",
};

const AUTO_REFRESH_MINUTES = 10;

// La marea "actual" y la próxima pleamar/bajamar se calculan a partir de sea_level_height_msl
// (nivel del mar, incluida marea) que devuelve la propia API de oleaje de Open-Meteo: nada que
// insertar ni que calcular con astronomía propia. Estos enlaces son solo para quien quiera el
// gráfico completo o la predicción oficial certificada.
const MAREA_URL = "https://marea.ooo/es/28.142/-15.413";
const TIDE_INFO_URL = "https://armada.defensa.gob.es/ihm/Aplicaciones/Mareas/puerto_mareas.html?puerto=56";

// Avisos oficiales y previsión de AEMET: data/aemet.json lo genera un GitHub Action
// programado (.github/workflows/aemet.yml, scripts/fetch-aemet.mjs) llamando a la API de
// AEMET OpenData desde el servidor de GitHub, nunca desde el navegador — así la API key no
// viaja al cliente y evitamos el problema de CORS de opendata.aemet.es en un sitio estático.
const AEMET_DATA_URL = "data/aemet.json";
const AEMET_AVISOS_URL = "https://www.aemet.es/es/eltiempo/prediccion/avisos?w=hoy&a=can";

function tr(field) {
  const lang = getLang();
  return field[lang] ?? field.es;
}

// Cámaras que Windy.com permite insertar directamente (reproductor público pensado para embeberse).
// Solo dejamos aquí la que se ha confirmado que realmente emite vídeo.
//
// SkylineWebcams se intentó como foto auto-actualizable vía https://cdn.skylinewebcams.com/live{id}.webp
// (la misma imagen que ellos usan como miniatura de "cámaras cercanas" en su propia web), pero en
// producción el navegador la bloquea con net::ERR_BLOCKED_BY_ORB: su CDN protege esa imagen
// (probablemente exige un Referer de su propio dominio) y no hay forma de sortear eso desde el
// navegador sin un proxy propio. Vuelven a ser enlace en WEBCAMS.
const EMBED_WEBCAMS = [
  {
    name: "La Cícer (Playa de Las Canteras) - El Burro",
    zone: "La Cícer",
    id: "1687952153",
    pageUrl: "https://webcams.windy.com/webcams/public/view/1687952153",
  },
];

// Cámaras públicas verificadas (proveedores externos, no operadas por esta app) que no permiten
// insertar su vídeo en otras páginas: se muestran como enlace directo a la web de cada proveedor.
const WEBCAMS = [
  {
    name: "Las Canteras (SkylineWebcams)",
    zone: "La Cícer / Playa Grande",
    desc: {
      es: "Cámara HD en directo de SkylineWebcams sobre el tramo central de la playa.",
      en: "SkylineWebcams' live HD camera over the central stretch of the beach.",
    },
    url: "https://www.skylinewebcams.com/es/webcam/espana/canarias/las-palmas-gran-canaria/playa-las-canteras.html",
    icon: "camera",
  },
  {
    name: "Playa Grande - Las Canteras (SkylineWebcams)",
    zone: "Playa Grande",
    desc: {
      es: "Segunda cámara de SkylineWebcams centrada en Playa Grande.",
      en: "A second SkylineWebcams camera focused on Playa Grande.",
    },
    url: "https://www.skylinewebcams.com/en/webcam/espana/canarias/las-palmas-gran-canaria/playa-grande-las-canteras.html",
    icon: "camera",
  },
  {
    name: "La Cícer - Surf (SkylineWebcams)",
    zone: "La Cícer",
    desc: {
      es: "Cámara de SkylineWebcams centrada en la zona de La Cícer, orientada a ver el estado del mar.",
      en: "SkylineWebcams' camera over La Cícer, oriented to check the state of the sea.",
    },
    url: "https://www.skylinewebcams.com/en/webcam/espana/canarias/las-palmas-gran-canaria/la-cicer-las-canteras.html",
    icon: "camera",
  },
  {
    name: "Las Canteras (WebcamTaxi)",
    zone: "Playa Las Canteras",
    desc: {
      es: "Vista general en directo de la playa desde WebcamTaxi.",
      en: "A live general view of the beach from WebcamTaxi.",
    },
    url: "https://www.webcamtaxi.com/en/spain/gran-canaria/playa-las-canteras.html",
    icon: "camera",
  },
  {
    name: "La Puntilla (WhatsUpCams)",
    zone: "La Puntilla",
    desc: {
      es: "Vista en directo del extremo sur de la playa, donde el Atlántico se junta con la arena dorada.",
      en: "A live view of the southern tip of the beach, where the Atlantic meets the golden sand.",
    },
    url: "https://www.whatsupcams.com/en/webcams/spain/canary-islands/las-palmas-gran-canaria/webcam-live-las-canteras-beach/",
    icon: "camera",
  },
  {
    name: "La Cícer, estado del mar y viento (Oceanside Gran Canaria)",
    zone: "La Cícer",
    desc: {
      es: "Cámara panorámica de una escuela de surf local, orientada a ver mar, viento y condiciones para deportes acuáticos.",
      en: "A panoramic camera from a local surf school, oriented to check the sea, wind and water sports conditions.",
    },
    url: "https://www.oceansidegrancanaria.com/webcam-las-canteras-beach-la-cicer-beach",
    icon: "surfboard",
  },
  {
    name: "La Barra (Spain-GranCanaria.com)",
    zone: "La Barra",
    desc: {
      es: "Vista de la zona norte de la playa, junto a la rompiente de La Barra.",
      en: "A view of the northern end of the beach, next to the La Barra break.",
    },
    url: "https://www.spain-grancanaria.com/en/images-videos/webcams/canteras-beach-la-barra.html",
    icon: "camera",
  },
  {
    name: "La Cícer — surf spot (Surf-Forecast)",
    zone: "La Cícer",
    desc: {
      es: "Ficha del spot de surf con webcam y previsión detallada de oleaje, energía y viento.",
      en: "A surf spot guide with webcam and detailed swell, power and wind forecast.",
    },
    url: "https://www.surf-forecast.com/breaks/La-Cicer",
    icon: "surfboard",
  },
];
