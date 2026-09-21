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
  ].join(","),
  hourly: ["wave_height", "wave_period", "wave_direction", "sea_surface_temperature"].join(","),
  timezone: "Atlantic/Canary",
  forecast_days: 7,
};

const AUTO_REFRESH_MINUTES = 10;

// Predicción oficial de mareas del Puerto de la Luz (Instituto Hidrográfico de la Marina).
// No la calculamos aquí: es un dato armónico que requiere fuentes oficiales, así que enlazamos.
const TIDE_INFO_URL = "https://armada.defensa.gob.es/ihm/Aplicaciones/Mareas/puerto_mareas.html?puerto=56";

const ZONES = [
  {
    name: "La Cícer",
    desc: "Extremo sur de la playa. Zona clásica de windsurf y kitesurf de Las Canteras gracias a los alisios de componente NE, con acceso al agua desde la orilla junto al muro.",
    tags: ["Windsurf", "Kitesurf", "Vela ligera"],
  },
  {
    name: "Peña La Vieja / Auditorio",
    desc: "Fondo rocoso junto al Auditorio Alfredo Kraus. Buena visibilidad y vida marina, habitual para snorkel y buceo en aguas poco profundas.",
    tags: ["Buceo", "Snorkel"],
  },
  {
    name: "Playa central (Las Coloradas)",
    desc: "El tramo central, protegido por la barra de arena/roca (La Barra), mantiene el agua en calma casi todo el año. La mejor zona para el baño, familias y paddle surf tranquilo.",
    tags: ["Natación", "Paddle surf", "Familias"],
  },
  {
    name: "La Puntilla",
    desc: "Extremo sur, más resguardado del viento. Aguas tranquilas, apta para baño e iniciación.",
    tags: ["Natación", "Iniciación"],
  },
  {
    name: "La Barra / El Confital",
    desc: "Extremo norte, donde la barra rocosa rompe el oleaje de fondo llegado del Atlántico. La rompiente de referencia para surfistas y bodyboarders en Las Canteras.",
    tags: ["Surf", "Bodyboard"],
  },
];

// Cámaras que Windy.com permite insertar directamente (reproductor público pensado para embeberse).
const EMBED_WEBCAMS = [
  {
    name: "La Cícer (Playa de Las Canteras) - El Burro",
    zone: "La Cícer",
    id: "1687952153",
    pageUrl: "https://webcams.windy.com/webcams/public/view/1687952153",
  },
  {
    name: "Las Canteras beach",
    zone: "Playa de Las Canteras",
    id: "1429130108",
    pageUrl: "https://www.windy.com/webcams/1429130108",
  },
  {
    name: "Beach de Las Canteras",
    zone: "Playa de Las Canteras",
    id: "1397657523",
    pageUrl: "https://www.windy.com/webcams/1397657523",
  },
];

// Cámaras públicas verificadas (proveedores externos, no operadas por esta app).
const WEBCAMS = [
  {
    name: "Las Canteras (SkylineWebcams)",
    zone: "La Cícer / Playa Grande",
    desc: "Cámara HD en directo de SkylineWebcams sobre el tramo central de la playa.",
    url: "https://www.skylinewebcams.com/es/webcam/espana/canarias/las-palmas-gran-canaria/playa-las-canteras.html",
    emoji: "📷",
  },
  {
    name: "Playa Grande - Las Canteras (SkylineWebcams)",
    zone: "Playa Grande",
    desc: "Segunda cámara de SkylineWebcams centrada en Playa Grande.",
    url: "https://www.skylinewebcams.com/en/webcam/espana/canarias/las-palmas-gran-canaria/playa-grande-las-canteras.html",
    emoji: "📷",
  },
  {
    name: "Las Canteras (WebcamTaxi)",
    zone: "Playa Las Canteras",
    desc: "Vista general en directo de la playa desde WebcamTaxi.",
    url: "https://www.webcamtaxi.com/en/spain/gran-canaria/playa-las-canteras.html",
    emoji: "🎥",
  },
  {
    name: "La Cícer / La Barra (WebcamTaxi)",
    zone: "La Cícer - La Barra",
    desc: "Vista del paseo y la zona norte de la playa, cerca de La Barra.",
    url: "https://www.webcamtaxi.com/en/spain/gran-canaria/las-palmas-canteras-beach-la-barra.html",
    emoji: "🎥",
  },
  {
    name: "Las Canteras (WhatsUpCams)",
    zone: "Playa de Las Canteras",
    desc: "Cámara en directo del portal WhatsUpCams con varias vistas de la playa.",
    url: "https://www.whatsupcams.com/en/webcams/spain/canary-islands/las-palmas-gran-canaria/webcam-playa-de-las-canteras-las-palmas/",
    emoji: "📹",
  },
  {
    name: "La Cícer, estado del mar y viento (Oceanside Gran Canaria)",
    zone: "La Cícer",
    desc: "Cámara panorámica de una escuela de surf/kite local, orientada a ver mar, viento y condiciones para deportes acuáticos.",
    url: "https://www.oceansidegrancanaria.com/webcam-las-canteras-beach-la-cicer-beach",
    emoji: "🏄",
  },
  {
    name: "Las Canteras (Spain-GranCanaria.com)",
    zone: "Playa de Las Canteras",
    desc: "Cámara HD en directo con vistas amplias de la playa urbana.",
    url: "https://www.spain-grancanaria.com/en/images-videos/webcams/playa-las-canteras-beach.html",
    emoji: "🎥",
  },
];
