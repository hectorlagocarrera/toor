const SUPPORTED_LANGS = ["es", "en"];
const LOCALE_CODE = { es: "es-ES", en: "en-GB" };

const I18N = {
  es: {
    "meta.title": "MeteoCanteras · Meteorología y mar en Las Canteras",
    "meta.description":
      "Meteorología, oleaje y mareas en tiempo real de la Playa de Las Canteras (Las Palmas de Gran Canaria) para surf, bodyboard, paddle surf, natación y buceo. Incluye cámaras en directo.",
    "refresh.label": "Actualizar datos",
    "theme.label": "Cambiar tema (claro/oscuro)",
    "share.label": "Compartir",
    "share.text": "MeteoCanteras — ahora en Las Canteras: {temp}°C, viento {wind} km/h, oleaje {wave} m, agua {water}°C.",
    "share.copied": "Copiado al portapapeles",
    "share.copyManually": "Copia este texto:",

    "nav.now": "Ahora",
    "nav.forecast": "Previsión",
    "nav.sports": "Deportes",
    "nav.cameras": "Cámaras",

    "now.lastUpdated": "Última actualización:",
    "card.air": "Aire",
    "card.air.feels": "Sensación",
    "card.wind": "Viento",
    "card.wind.gusts": "Rachas",
    "card.waves": "Oleaje",
    "card.waves.period": "Periodo",
    "card.waves.direction": "Dirección",
    "card.swell": "Mar de fondo",
    "card.tide": "Marea",
    "card.water": "Agua",
    "card.water.sub": "Temperatura del mar",
    "card.uv": "Sol / UV",
    "card.uv.sunrise": "Amanecer",
    "card.uv.sunset": "Ocaso",
    "card.humidity": "Humedad",
    "card.humidity.visibility": "Visibilidad",
    "card.rain": "Lluvia",
    "card.rain.prob": "Prob. próxima hora",
    "tide.noData": "Sin datos de marea",
    "tide.noDataSub": "para este punto ahora mismo",
    "tide.rising": "Subiendo",
    "tide.falling": "Bajando",
    "tide.next": "Próx.",

    "forecast.tableTitle": "Previsión detallada",
    "forecast.tableHint":
      "Viento, oleaje y temperatura del aire y del agua cada 3 horas para los próximos días. Desliza para ver más horas.",
    "forecast.tableEmpty": "Sin datos suficientes para la tabla ahora mismo.",
    "wg.legend.light": "Viento flojo",
    "wg.legend.moderate": "Moderado",
    "wg.legend.strong": "Fuerte",
    "wg.legend.veryStrong": "Muy fuerte",
    "wg.legend.smallSwell": "Oleaje pequeño",
    "wg.legend.bigSwell": "Oleaje grande",
    "wg.row.day": "Día",
    "wg.row.hour": "Hora",
    "wg.row.wind": "Viento km/h",
    "wg.row.gusts": "Rachas km/h",
    "wg.row.windDir": "Dir. viento",
    "wg.row.waves": "Oleaje m",
    "wg.row.period": "Periodo s",
    "wg.row.waveDir": "Dir. oleaje",
    "wg.row.tempAir": "Temp. aire °C",
    "wg.row.tempWater": "Temp. agua °C",
    "forecast.next24": "Próximas 24 horas",
    "forecast.nextDays": "Próximos días",
    "forecast.bestDay": "Mejor día para surfear",

    "aemet.forecastTitle": "Previsión oficial (AEMET)",
    "aemet.forecastHint":
      "Para contrastar con los datos de arriba. AEMET usa su propio modelo y no siempre coincide al detalle con Open-Meteo.",
    "aemet.noData": "Todavía no hay datos de AEMET disponibles (se actualizan cada 2 horas).",
    "aemet.rain": "lluvia",
    "aemet.level.amarillo": "Aviso amarillo",
    "aemet.level.naranja": "Aviso naranja",
    "aemet.level.rojo": "Aviso rojo",
    "aemet.bannerUntil": "hasta",
    "aemet.bannerMore": "+{count} aviso(s) más — ver todos",
    "aemet.bannerLinkLabel": "Ver avisos oficiales de AEMET para Canarias",

    "sports.surfReportTitle": "Informe de surf — La Barra / El Confital",
    "sports.surfReportHint":
      "Mejores franjas horarias, mar de fondo, potencia de la ola y viento, pensado para decidir cuándo remar hacia La Barra.",
    "sports.tideTitle": "Marea — Puerto de la Luz",
    "sports.tideHint":
      "La Barra es sensible a la marea: en bajamar la ola rompe más hueca y sobre menos fondo. Calculada a partir del modelo de nivel del mar de Open-Meteo.",
    "sports.sportsTitle": "Aptitud por deporte acuático",
    "sports.sportsHint":
      "Orientación general a partir del viento y el oleaje actuales. No sustituye la señalización de socorristas ni el sentido común en el agua.",
    "sports.windows.title": "Mejores franjas para surfear",
    "sports.windows.today": "Hoy",
    "sports.windows.bestAround": "Mejor momento sobre las",
    "sports.windows.empty":
      "No se esperan condiciones especialmente buenas para surfear en las próximas horas. Revisa la previsión de los próximos días.",
    "sports.heatmap.title": "Hora a hora (próximas {n}h)",
    "sports.heatmap.caption": "Las horas de noche nunca se recomiendan, aunque el oleaje sea bueno sobre el papel.",
    "sports.heatmap.night": "de noche, sin luz",
    "sports.heatmap.noData": "Sin datos",
    "sports.heatmap.legendNight": "Noche",

    "surf.swellHeight": "Mar de fondo",
    "surf.swellType": "Tipo de swell",
    "surf.power": "Potencia estimada",
    "surf.direction": "Orientación del swell",
    "surf.wind": "Viento",

    "wetsuit.none": "Bañador, sin neopreno",
    "wetsuit.shorty": "Shorty 2 mm (opcional)",
    "wetsuit.32": "Neopreno 3/2 mm",
    "wetsuit.43": "Neopreno 4/3 mm + botas",
    "wetsuit.54": "Neopreno 5/4 mm + botas y guantes",
    "wetsuit.54hood": "Neopreno 5/4 mm + capucha, botas y guantes",

    "riprisk.title": "Riesgo de corriente (orientativo)",
    "riprisk.hint":
      "Estimación propia y simplificada a partir del oleaje, la marea y el viento — no es el aviso oficial de socorristas ni un modelo certificado como el de la NOAA.",
    "riprisk.bajo": "Bajo",
    "riprisk.moderado": "Moderado",
    "riprisk.alto": "Alto",
    "riprisk.reason.wave": "oleaje considerable",
    "riprisk.reason.tide": "marea baja",
    "riprisk.reason.wind": "viento fuerte de cara",
    "riprisk.reasonPrefix": "Por:",
    "riprisk.noReasons": "Sin factores destacados ahora mismo.",

    "tide.above": "m sobre el nivel medio",
    "tide.highTide": "Pleamar",
    "tide.lowTide": "Bajamar",
    "tide.noExtremes": "Sin próximos cambios de marea en el rango de datos.",
    "tide.noDataPanel": "Sin datos de marea disponibles para este punto ahora mismo.",
    "tide.fullChart": "Ver gráfico completo (marea.ooo)",
    "tide.official": "Predicción oficial IHM",
    "tide.note":
      "Calculada con el nivel del mar (incluye marea) del modelo marino de Open-Meteo, ~8 km de resolución: útil para hacerse una idea, pero no reemplaza la predicción oficial para navegación.",
    "tide.now": "Ahora",

    "cameras.liveTitle": "Cámaras sin clics",
    "cameras.liveHint": "Vídeo en directo (Windy.com) y fotos que se actualizan solas cada poco tiempo (SkylineWebcams), sin tener que abrir otra web. Si alguna falla, usa el enlace de debajo.",
    "cameras.moreTitle": "Más cámaras de la playa",
    "cameras.moreHint":
      "Estas cámaras no se pueden insertar en otras páginas (o su emisión no es fiable), así que se abren en la web de cada proveedor.",
    "cameras.viewLive": "Ver en directo",
    "cameras.notLoading": "¿No carga? Verla en la web original",
    "cameras.live": "En directo",
    "cameras.autoRefresh": "Foto cada ~90 s",
    "cameras.photoError": "No se pudo cargar la imagen",

    "beach.disclaimer":
      "Esta aplicación tiene fines informativos y no constituye un aviso oficial de seguridad. Respeta siempre las banderas y las indicaciones de Cruz Roja / socorrismo en la playa.",
    "footer.text": "MeteoCanteras · Datos: Open-Meteo · Hecho para la comunidad de deportes acuáticos de Las Canteras",

    "error.marine": "No se han podido obtener los datos de oleaje en este momento. El resto de datos meteorológicos son correctos.",
    "error.general": "No se han podido cargar los datos meteorológicos. Comprueba tu conexión y vuelve a intentarlo.",

    "rating.excelente": "Excelente",
    "rating.bueno": "Bueno",
    "rating.regular": "Regular",
    "rating.malo": "Malo",
    "rating.sinDatos": "Sin datos",

    "uv.bajo": "Bajo",
    "uv.moderado": "Moderado",
    "uv.alto": "Alto",
    "uv.muyAlto": "Muy alto",
    "uv.extremo": "Extremo",
  },

  en: {
    "meta.title": "MeteoCanteras · Weather & sea conditions in Las Canteras",
    "meta.description":
      "Live weather, swell and tide data for Las Canteras Beach (Las Palmas de Gran Canaria) for surfing, bodyboarding, paddleboarding, swimming and diving. Includes live webcams.",
    "refresh.label": "Refresh data",
    "theme.label": "Toggle light/dark theme",
    "share.label": "Share",
    "share.text": "MeteoCanteras — right now at Las Canteras: {temp}°C, {wind} km/h wind, {wave} m waves, {water}°C water.",
    "share.copied": "Copied to clipboard",
    "share.copyManually": "Copy this text:",

    "nav.now": "Now",
    "nav.forecast": "Forecast",
    "nav.sports": "Sports",
    "nav.cameras": "Cameras",

    "now.lastUpdated": "Last updated:",
    "card.air": "Air",
    "card.air.feels": "Feels like",
    "card.wind": "Wind",
    "card.wind.gusts": "Gusts",
    "card.waves": "Waves",
    "card.waves.period": "Period",
    "card.waves.direction": "Direction",
    "card.swell": "Swell",
    "card.tide": "Tide",
    "card.water": "Water",
    "card.water.sub": "Sea temperature",
    "card.uv": "Sun / UV",
    "card.uv.sunrise": "Sunrise",
    "card.uv.sunset": "Sunset",
    "card.humidity": "Humidity",
    "card.humidity.visibility": "Visibility",
    "card.rain": "Rain",
    "card.rain.prob": "Chance next hour",
    "tide.noData": "No tide data",
    "tide.noDataSub": "for this spot right now",
    "tide.rising": "Rising",
    "tide.falling": "Falling",
    "tide.next": "Next",

    "forecast.tableTitle": "Detailed forecast",
    "forecast.tableHint":
      "Wind, waves, and air and water temperature every 3 hours for the coming days. Scroll sideways for more hours.",
    "forecast.tableEmpty": "Not enough data for the table right now.",
    "wg.legend.light": "Light wind",
    "wg.legend.moderate": "Moderate",
    "wg.legend.strong": "Strong",
    "wg.legend.veryStrong": "Very strong",
    "wg.legend.smallSwell": "Small swell",
    "wg.legend.bigSwell": "Big swell",
    "wg.row.day": "Day",
    "wg.row.hour": "Time",
    "wg.row.wind": "Wind km/h",
    "wg.row.gusts": "Gusts km/h",
    "wg.row.windDir": "Wind dir.",
    "wg.row.waves": "Waves m",
    "wg.row.period": "Period s",
    "wg.row.waveDir": "Wave dir.",
    "wg.row.tempAir": "Air temp. °C",
    "wg.row.tempWater": "Water temp. °C",
    "forecast.next24": "Next 24 hours",
    "forecast.nextDays": "Upcoming days",
    "forecast.bestDay": "Best day to surf",

    "aemet.forecastTitle": "Official forecast (AEMET)",
    "aemet.forecastHint":
      "To cross-check against the data above. AEMET uses its own model and doesn't always match Open-Meteo exactly.",
    "aemet.noData": "No AEMET data available yet (it updates every 2 hours).",
    "aemet.rain": "rain",
    "aemet.level.amarillo": "Yellow warning",
    "aemet.level.naranja": "Orange warning",
    "aemet.level.rojo": "Red warning",
    "aemet.bannerUntil": "until",
    "aemet.bannerMore": "+{count} more warning(s) — see all",
    "aemet.bannerLinkLabel": "See official AEMET warnings for the Canary Islands",

    "sports.surfReportTitle": "Surf report — La Barra / El Confital",
    "sports.surfReportHint":
      "Best time windows, swell, wave power and wind, to help you decide when to paddle out at La Barra.",
    "sports.tideTitle": "Tide — Puerto de la Luz",
    "sports.tideHint":
      "La Barra is tide-sensitive: at low tide the wave breaks hollower over less water. Calculated from Open-Meteo's sea-level model.",
    "sports.sportsTitle": "Suitability by water sport",
    "sports.sportsHint":
      "A general guide based on current wind and swell. It doesn't replace lifeguard flags or common sense in the water.",
    "sports.windows.title": "Best times to surf",
    "sports.windows.today": "Today",
    "sports.windows.bestAround": "Best around",
    "sports.windows.empty":
      "No particularly good surf conditions expected in the coming hours. Check the forecast for the next few days.",
    "sports.heatmap.title": "Hour by hour (next {n}h)",
    "sports.heatmap.caption": "Night-time hours are never recommended, even if the swell looks good on paper.",
    "sports.heatmap.night": "night, no daylight",
    "sports.heatmap.noData": "No data",
    "sports.heatmap.legendNight": "Night",

    "surf.swellHeight": "Swell",
    "surf.swellType": "Swell type",
    "surf.power": "Estimated power",
    "surf.direction": "Swell direction fit",
    "surf.wind": "Wind",

    "wetsuit.none": "Swimsuit, no wetsuit",
    "wetsuit.shorty": "2 mm shorty (optional)",
    "wetsuit.32": "3/2 mm wetsuit",
    "wetsuit.43": "4/3 mm wetsuit + boots",
    "wetsuit.54": "5/4 mm wetsuit + boots and gloves",
    "wetsuit.54hood": "5/4 mm wetsuit + hood, boots and gloves",

    "riprisk.title": "Rip current risk (estimate)",
    "riprisk.hint":
      "Our own simplified estimate from swell, tide and wind — not the official lifeguard warning, and not a certified model like NOAA's.",
    "riprisk.bajo": "Low",
    "riprisk.moderado": "Moderate",
    "riprisk.alto": "High",
    "riprisk.reason.wave": "sizeable swell",
    "riprisk.reason.tide": "low tide",
    "riprisk.reason.wind": "strong onshore wind",
    "riprisk.reasonPrefix": "Because of:",
    "riprisk.noReasons": "No notable factors right now.",

    "tide.above": "m above mean sea level",
    "tide.highTide": "High tide",
    "tide.lowTide": "Low tide",
    "tide.noExtremes": "No upcoming tide change within the available data.",
    "tide.noDataPanel": "No tide data available for this spot right now.",
    "tide.fullChart": "See full chart (marea.ooo)",
    "tide.official": "Official IHM prediction",
    "tide.note":
      "Calculated from the sea level (tide included) of Open-Meteo's marine model, ~8 km resolution: good for a general idea, but not a substitute for the official prediction for navigation.",
    "tide.now": "Now",

    "cameras.liveTitle": "No-click cameras",
    "cameras.liveHint": "Live video (Windy.com) and photos that refresh themselves every so often (SkylineWebcams), without opening another site. If one fails, use the link below it.",
    "cameras.moreTitle": "More beach webcams",
    "cameras.moreHint":
      "These cameras can't be embedded on other pages (or their stream isn't reliable), so they open on each provider's own site.",
    "cameras.viewLive": "Watch live",
    "cameras.notLoading": "Not loading? Watch it on the original site",
    "cameras.live": "Live",
    "cameras.autoRefresh": "Photo every ~90s",
    "cameras.photoError": "Couldn't load the image",

    "beach.disclaimer":
      "This app is for informational purposes only and is not an official safety notice. Always follow the beach flags and lifeguard/Red Cross instructions.",
    "footer.text": "MeteoCanteras · Data: Open-Meteo · Built for the Las Canteras watersports community",

    "error.marine": "Couldn't fetch swell data right now. The rest of the weather data is still accurate.",
    "error.general": "Couldn't load weather data. Check your connection and try again.",

    "rating.excelente": "Excellent",
    "rating.bueno": "Good",
    "rating.regular": "Fair",
    "rating.malo": "Poor",
    "rating.sinDatos": "No data",

    "uv.bajo": "Low",
    "uv.moderado": "Moderate",
    "uv.alto": "High",
    "uv.muyAlto": "Very high",
    "uv.extremo": "Extreme",
  },
};

function detectInitialLang() {
  try {
    const saved = localStorage.getItem("mc_lang");
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  } catch (e) {
    /* localStorage puede estar bloqueado (modo privado); usamos el idioma del navegador */
  }
  const nav = (navigator.language || "es").slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(nav) ? nav : "es";
}

let currentLang = detectInitialLang();

function getLang() {
  return currentLang;
}

function getLocale() {
  return LOCALE_CODE[currentLang] || LOCALE_CODE.es;
}

function t(key, vars) {
  const dict = I18N[currentLang] || I18N.es;
  let value = dict[key];
  if (value === undefined) value = I18N.es[key];
  if (value === undefined) return key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      value = value.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    });
  }
  return value;
}

function ratingLabel(key) {
  return key ? t(`rating.${key}`) : t("rating.sinDatos");
}

function applyStaticI18n() {
  document.documentElement.lang = currentLang;
  document.title = t("meta.title");
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", t("meta.description"));

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.dataset.i18nAttr.split(";").forEach((pair) => {
      const [attr, key] = pair.split(":");
      el.setAttribute(attr, t(key));
    });
  });
}

function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  try {
    localStorage.setItem("mc_lang", lang);
  } catch (e) {
    /* no pasa nada si no se puede persistir */
  }
  document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === lang));
  applyStaticI18n();
  if (typeof loadAll === "function") loadAll();
  if (typeof renderEmbedWebcams === "function") renderEmbedWebcams();
  if (typeof renderWebcams === "function") renderWebcams();
}
