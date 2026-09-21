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
    "sea_surface_temperature",
    "sea_level_height_msl",
  ].join(","),
  timezone: "Atlantic/Canary",
  forecast_days: 7,
};

const AUTO_REFRESH_MINUTES = 10;

// La marea "actual" y la próxima pleamar/bajamar se calculan a partir de sea_level_height_msl
// (nivel del mar, incluida marea) que devuelve la propia API de oleaje de Open-Meteo: nada que
// insertar ni que calcular con astronomía propia. Estos enlaces son solo para quien quiera el
// gráfico completo o la predicción oficial certificada.
const MAREA_URL = "https://marea.ooo/es/28.142/-15.413";
const TIDE_INFO_URL = "https://armada.defensa.gob.es/ihm/Aplicaciones/Mareas/puerto_mareas.html?puerto=56";

const ZONES = [
  {
    name: "La Cícer",
    desc: "Extremo sur de la playa, junto al muro del paseo. Una de las zonas con más ambiente y accesos al agua de Las Canteras.",
    tags: ["Baño", "Ambiente"],
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
// Solo dejamos aquí la que se ha confirmado que realmente emite vídeo: las otras cámaras de
// usuarios de Windy que probamos aparecían en negro, así que se han movido a WEBCAMS como enlace.
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
    name: "Las Canteras beach (Windy.com)",
    zone: "Playa de Las Canteras",
    desc: "Cámara de usuario en Windy.com. Su reproductor no siempre emite vídeo en directo.",
    url: "https://www.windy.com/webcams/1429130108",
    emoji: "📹",
  },
  {
    name: "Beach de Las Canteras (Windy.com)",
    zone: "Playa de Las Canteras",
    desc: "Cámara de usuario en Windy.com. Su reproductor no siempre emite vídeo en directo.",
    url: "https://www.windy.com/webcams/1397657523",
    emoji: "📹",
  },
  {
    name: "Webcam Playa De Las Canteras (Windy.com)",
    zone: "Playa de Las Canteras",
    desc: "Cámara de usuario en Windy.com. Su reproductor no siempre emite vídeo en directo.",
    url: "https://www.windy.com/webcams/1512678906",
    emoji: "📹",
  },
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
    name: "La Cícer - Surf (SkylineWebcams)",
    zone: "La Cícer",
    desc: "Cámara de SkylineWebcams centrada en la zona de La Cícer, orientada a ver el estado del mar.",
    url: "https://www.skylinewebcams.com/en/webcam/espana/canarias/las-palmas-gran-canaria/la-cicer-las-canteras.html",
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
    name: "La Puntilla (WhatsUpCams)",
    zone: "La Puntilla",
    desc: "Vista en directo del extremo sur de la playa, donde el Atlántico se junta con la arena dorada.",
    url: "https://www.whatsupcams.com/en/webcams/spain/canary-islands/las-palmas-gran-canaria/webcam-live-las-canteras-beach/",
    emoji: "📹",
  },
  {
    name: "La Cícer, estado del mar y viento (Oceanside Gran Canaria)",
    zone: "La Cícer",
    desc: "Cámara panorámica de una escuela de surf local, orientada a ver mar, viento y condiciones para deportes acuáticos.",
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
  {
    name: "La Barra (Spain-GranCanaria.com)",
    zone: "La Barra",
    desc: "Vista de la zona norte de la playa, junto a la rompiente de La Barra.",
    url: "https://www.spain-grancanaria.com/en/images-videos/webcams/canteras-beach-la-barra.html",
    emoji: "🎥",
  },
  {
    name: "La Cícer — surf spot (Surf-Forecast)",
    zone: "La Cícer",
    desc: "Ficha del spot de surf con webcam y previsión detallada de oleaje, energía y viento.",
    url: "https://www.surf-forecast.com/breaks/La-Cicer",
    emoji: "🏄",
  },
  {
    name: "Las Canteras (ExploreWebcams)",
    zone: "Playa de Las Canteras",
    desc: "Cámara HD en directo agregada por ExploreWebcams.",
    url: "https://www.explorewebcams.com/las-canteras-beach-gran-canaria",
    emoji: "🎥",
  },
  {
    name: "Las Canteras (LiveBeaches)",
    zone: "Playa de Las Canteras",
    desc: "Cámara en directo de la playa, con foco en el ambiente y el oleaje en la orilla.",
    url: "https://www.livebeaches.com/spain/las-canteras-beach-live-cam/",
    emoji: "🎥",
  },
  {
    name: "Playa Grande (miplayadelascanteras.com)",
    zone: "Playa Grande",
    desc: "Cámara del portal ciudadano dedicado a Las Canteras, vista desde el hotel Aloe Canteras.",
    url: "https://miplayadelascanteras.com/webcam-playa-grandelascanteras/",
    emoji: "📷",
  },
  {
    name: "Las Canteras (CanariasLife)",
    zone: "Playa de Las Canteras",
    desc: "Cámara en directo pensada para ver el estado del mar, la ocupación de la playa y la luz disponible.",
    url: "https://canariaslife.com/en/webcams-of-gran-canaria/las-palmas-de-gran-canaria/las-canteras-beach/",
    emoji: "📷",
  },
];
