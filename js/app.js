const els = (id) => document.getElementById(id);

function setText(id, value) {
  const el = els(id);
  if (el) el.textContent = value;
}

function showBanner(message) {
  const el = els("statusBanner");
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

function hideBanner() {
  const el = els("statusBanner");
  if (el) el.hidden = true;
}

function initTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      buttons.forEach((b) => b.classList.toggle("is-active", b === btn));
      document.querySelectorAll(".tab-panel").forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.panel === target);
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function renderCurrent(forecast, marine) {
  const cur = forecast.current || {};
  setText("airTemp", cur.temperature_2m?.toFixed(1) ?? "--");
  setText("feelsLike", cur.apparent_temperature?.toFixed(1) ?? "--");
  setText("weatherDesc", weatherCodeToText(cur.weather_code));
  setText("windSpeed", cur.wind_speed_10m?.toFixed(0) ?? "--");
  setText("windGust", cur.wind_gusts_10m?.toFixed(0) ?? "--");
  setText("windDir", degreesToCompass(cur.wind_direction_10m));
  const arrowEl = els("windArrow");
  if (arrowEl && cur.wind_direction_10m !== undefined) {
    arrowEl.style.display = "inline-block";
    arrowEl.style.transform = `rotate(${cur.wind_direction_10m}deg)`;
  }
  setText("humidity", cur.relative_humidity_2m?.toFixed(0) ?? "--");
  setText("visibility", cur.visibility !== undefined ? (cur.visibility / 1000).toFixed(1) : "--");
  setText("precip", cur.precipitation?.toFixed(1) ?? "0.0");

  const hourly = forecast.hourly;
  if (hourly && hourly.time) {
    const nowIdx = findNearestHourIndex(hourly.time);
    setText("precipProb", hourly.precipitation_probability?.[nowIdx] ?? "--");
    setText("uvIndex", (hourly.uv_index?.[nowIdx] ?? cur.uv_index)?.toFixed?.(0) ?? "--");
    setText("uvLabel", uvIndexLabel(hourly.uv_index?.[nowIdx] ?? cur.uv_index));
  }

  const daily = forecast.daily;
  if (daily && daily.time && daily.time.length) {
    setText("sunrise", formatHour(daily.sunrise[0]));
    setText("sunset", formatHour(daily.sunset[0]));
  }

  if (marine && marine.current) {
    const mc = marine.current;
    setText("waveHeight", mc.wave_height?.toFixed(1) ?? "--");
    setText("wavePeriod", mc.wave_period?.toFixed(0) ?? "--");
    setText("waveDir", degreesToCompass(mc.wave_direction));
    setText("swellHeight", mc.swell_wave_height?.toFixed(1) ?? "--");
    setText("swellPeriod", mc.swell_wave_period?.toFixed(0) ?? "--");
    setText("swellDir", degreesToCompass(mc.swell_wave_direction));
    setText("waterTemp", mc.sea_surface_temperature?.toFixed(1) ?? "--");
  } else {
    ["waveHeight", "wavePeriod", "waveDir", "swellHeight", "swellPeriod", "swellDir", "waterTemp"].forEach((id) =>
      setText(id, "--")
    );
  }
}

function findNearestHourIndex(timeArray) {
  const now = Date.now();
  let bestIdx = 0;
  let bestDiff = Infinity;
  timeArray.forEach((t, i) => {
    const diff = Math.abs(new Date(t).getTime() - now);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  });
  return bestIdx;
}

function renderHourly(forecast, marine) {
  const container = els("hourlyList");
  if (!container || !forecast.hourly) return;
  container.innerHTML = "";
  const h = forecast.hourly;
  const startIdx = findNearestHourIndex(h.time);
  const waveByTime = {};
  if (marine && marine.hourly) {
    marine.hourly.time.forEach((t, i) => {
      waveByTime[t] = marine.hourly.wave_height?.[i];
    });
  }

  for (let i = startIdx; i < Math.min(startIdx + 24, h.time.length); i++) {
    const card = document.createElement("div");
    card.className = "hour-card";
    const wave = waveByTime[h.time[i]];
    card.innerHTML = `
      <div class="hh">${formatHour(h.time[i])}</div>
      <div class="temp">${Math.round(h.temperature_2m[i])}°</div>
      <div class="wind">💨 ${Math.round(h.wind_speed_10m[i])} km/h</div>
      ${wave !== undefined && wave !== null ? `<div class="wave">🌊 ${wave.toFixed(1)} m</div>` : ""}
    `;
    container.appendChild(card);
  }
}

function renderDaily(forecast) {
  const container = els("dailyList");
  if (!container || !forecast.daily) return;
  container.innerHTML = "";
  const d = forecast.daily;
  d.time.forEach((date, i) => {
    const row = document.createElement("div");
    row.className = "day-row";
    row.innerHTML = `
      <div class="day-name">${formatDayName(date)}</div>
      <div class="day-desc">${weatherCodeToText(d.weather_code[i])}</div>
      <div class="day-temps">${Math.round(d.temperature_2m_max[i])}° / ${Math.round(d.temperature_2m_min[i])}°</div>
      <div class="day-wind">💨 ${Math.round(d.wind_speed_10m_max[i])} km/h</div>
    `;
    container.appendChild(row);
  });
}

function renderSurfReport(forecast, marine) {
  const container = els("surfReport");
  if (!container) return;
  const cur = forecast.current || {};
  const mc = marine?.current;

  const report = computeSurfReport({
    waveHeight: mc?.wave_height ?? null,
    wavePeriod: mc?.wave_period ?? null,
    swellHeight: mc?.swell_wave_height ?? null,
    swellPeriod: mc?.swell_wave_period ?? null,
    swellDir: mc?.swell_wave_direction ?? null,
    waveDir: mc?.wave_direction ?? null,
    windSpeed: cur.wind_speed_10m ?? null,
    windGust: cur.wind_gusts_10m ?? null,
    windDir: cur.wind_direction_10m ?? null,
  });

  const fmt = (v, decimals = 1) => (v === null || v === undefined ? "--" : v.toFixed(decimals));

  container.innerHTML = `
    <div class="surf-stat">
      <span class="surf-stat-label">Mar de fondo</span>
      <span class="surf-stat-value">${fmt(report.swellHeight)} m</span>
      <span class="surf-stat-sub">Periodo ${fmt(report.swellPeriod, 0)} s</span>
    </div>
    <div class="surf-stat">
      <span class="surf-stat-label">Tipo de swell</span>
      <span class="surf-stat-value surf-stat-text">${report.periodType}</span>
    </div>
    <div class="surf-stat">
      <span class="surf-stat-label">Potencia estimada</span>
      <span class="surf-stat-value">${fmt(report.power, 1)} <small>kW/m</small></span>
      <span class="badge badge-${report.powerClass}">${report.powerLabel}</span>
    </div>
    <div class="surf-stat">
      <span class="surf-stat-label">Orientación del swell</span>
      <span class="surf-stat-value surf-stat-text">${report.directionMatch}</span>
    </div>
    <div class="surf-stat">
      <span class="surf-stat-label">Viento</span>
      <span class="surf-stat-value">${fmt(report.windSpeed, 0)} <small>km/h</small></span>
      <span class="surf-stat-sub">${report.windType}${report.windDir !== null ? ` · ${degreesToCompass(report.windDir)}` : ""}</span>
    </div>
    <div class="surf-stat surf-stat-tide">
      <span class="surf-stat-label">Marea</span>
      <span class="surf-stat-sub">La Barra es sensible a la marea (más hueca y peligrosa en bajamar). Consulta la predicción oficial:</span>
      <a href="${TIDE_INFO_URL}" target="_blank" rel="noopener noreferrer" class="surf-stat-link">Ver tabla de mareas (Puerto de la Luz) ↗</a>
    </div>
  `;
}

function renderEmbedWebcams() {
  const container = els("embedGrid");
  if (!container) return;
  container.innerHTML = "";
  EMBED_WEBCAMS.forEach((cam) => {
    const card = document.createElement("div");
    card.className = "embed-card";
    card.innerHTML = `
      <p class="embed-name">📍 ${cam.name} <span class="embed-zone">· ${cam.zone}</span></p>
      <div class="embed-frame-wrap">
        <iframe
          src="https://webcams.windy.com/webcams/public/embed/player/${cam.id}/live"
          loading="lazy"
          allowfullscreen
          referrerpolicy="no-referrer-when-downgrade"
          title="Cámara en directo: ${cam.name}"
        ></iframe>
      </div>
      <a class="embed-fallback-link" href="${cam.pageUrl}" target="_blank" rel="noopener noreferrer">¿No carga el vídeo? Verla en Windy.com ↗</a>
    `;
    container.appendChild(card);
  });
}

function renderSports(forecast, marine) {
  const container = els("sportGrid");
  if (!container) return;
  const cur = forecast.current || {};
  const mc = marine?.current;

  const ratings = computeSportRatings({
    windSpeed: cur.wind_speed_10m,
    windGust: cur.wind_gusts_10m,
    windDir: cur.wind_direction_10m,
    waveHeight: mc?.wave_height ?? null,
    wavePeriod: mc?.wave_period ?? null,
    swellHeight: mc?.swell_wave_height ?? null,
    swellPeriod: mc?.swell_wave_period ?? null,
  });

  container.innerHTML = "";
  ratings.forEach((sport) => {
    const card = document.createElement("article");
    card.className = "sport-card";
    const badgeClass = sport.rating ? `badge-${sport.rating}` : "badge-regular";
    card.innerHTML = `
      <div class="sport-card-top">
        <div class="sport-name"><span class="sport-emoji">${sport.emoji}</span> ${sport.name}</div>
        <span class="badge ${badgeClass}">${sport.ratingLabel}</span>
      </div>
      <p class="sport-why">${sport.why}</p>
    `;
    container.appendChild(card);
  });
}

function renderWebcams() {
  const container = els("webcamGrid");
  if (!container) return;
  container.innerHTML = "";
  WEBCAMS.forEach((cam) => {
    const a = document.createElement("a");
    a.className = "webcam-card";
    a.href = cam.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.innerHTML = `
      <div class="webcam-top">
        <span class="webcam-emoji">${cam.emoji}</span>
        <span class="webcam-name">${cam.name}</span>
      </div>
      <p class="webcam-zone">📍 ${cam.zone}</p>
      <p class="webcam-desc">${cam.desc}</p>
      <span class="webcam-link">Ver en directo ↗</span>
    `;
    container.appendChild(a);
  });
}

function renderZones() {
  const container = els("zoneList");
  if (!container) return;
  container.innerHTML = "";
  ZONES.forEach((zone) => {
    const card = document.createElement("div");
    card.className = "zone-card";
    card.innerHTML = `
      <h3>${zone.name}</h3>
      <p>${zone.desc}</p>
      <div class="zone-tags">${zone.tags.map((t) => `<span class="zone-tag">${t}</span>`).join("")}</div>
    `;
    container.appendChild(card);
  });
}

async function loadAll() {
  hideBanner();
  try {
    const { forecast, marine, marineError } = await fetchWeatherData();
    renderCurrent(forecast, marine);
    renderHourly(forecast, marine);
    renderDaily(forecast);
    renderSports(forecast, marine);
    renderSurfReport(forecast, marine);
    setText("lastUpdated", new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }));
    if (marineError) {
      showBanner("No se han podido obtener los datos de oleaje en este momento. El resto de datos meteorológicos son correctos.");
    }
  } catch (err) {
    console.error(err);
    showBanner("No se han podido cargar los datos meteorológicos. Comprueba tu conexión y vuelve a intentarlo.");
  }
}

function init() {
  initTabs();
  renderEmbedWebcams();
  renderWebcams();
  renderZones();
  loadAll();
  els("refreshBtn")?.addEventListener("click", loadAll);
  setInterval(loadAll, AUTO_REFRESH_MINUTES * 60 * 1000);
}

document.addEventListener("DOMContentLoaded", init);
