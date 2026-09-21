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

  const mh = marine?.hourly;
  const tide = mh?.sea_level_height_msl ? computeTideInfo(mh.time, mh.sea_level_height_msl, findNearestHourIndex(mh.time)) : null;
  if (tide) {
    setText("tideHeight", tide.nowHeight.toFixed(2));
    setText("tideTrend", tide.trend === "subiendo" ? "⬆ Subiendo" : tide.trend === "bajando" ? "⬇ Bajando" : "—");
    const next = tide.extremes[0];
    setText("tideNext", next ? `Próx. ${next.type}: ${formatHour(next.time)} (${next.height.toFixed(2)} m)` : "—");
  } else {
    setText("tideHeight", "--");
    setText("tideTrend", "Sin datos de marea");
    setText("tideNext", "para este punto ahora mismo");
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

function renderWindguruTable(forecast, marine) {
  const container = els("windguruTable");
  if (!container) return;
  const fh = forecast.hourly;
  const mh = marine?.hourly;
  if (!fh?.time || !mh?.wave_height) {
    container.innerHTML = `<p class="section-hint">Sin datos suficientes para la tabla ahora mismo.</p>`;
    return;
  }

  const marineByTime = {};
  mh.time.forEach((t, i) => {
    marineByTime[t] = {
      height: mh.wave_height[i],
      period: mh.wave_period[i],
      dir: mh.wave_direction[i],
      sst: mh.sea_surface_temperature?.[i],
    };
  });

  const startIdx = findNearestHourIndex(fh.time);
  const step = 3;
  const totalColumns = 20;
  const slots = [];
  for (let i = startIdx; i < fh.time.length && slots.length < totalColumns; i += step) {
    slots.push(i);
  }

  const arrow = (deg) => (deg === null || deg === undefined ? "--" : `<span class="wg-arrow" style="transform:rotate(${deg}deg)">↓</span>`);
  const cell = (value, extraClass = "") => `<td class="wg-cell ${extraClass}">${value === null || value === undefined ? "--" : value}</td>`;

  let lastDayKey = null;
  const dayRow = slots
    .map((i) => {
      const dayKey = fh.time[i].slice(0, 10);
      const isNewDay = dayKey !== lastDayKey;
      lastDayKey = dayKey;
      const label = isNewDay ? new Date(fh.time[i]).toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }) : "";
      return `<td class="wg-cell wg-day-cell">${label}</td>`;
    })
    .join("");

  const hourRow = slots.map((i) => cell(formatHour(fh.time[i]))).join("");
  const windRow = slots
    .map((i) => {
      const v = fh.wind_speed_10m[i];
      const band = windBand(v);
      return cell(v != null ? Math.round(v) : null, band !== null ? `wg-wind-${band}` : "");
    })
    .join("");
  const gustRow = slots.map((i) => cell(fh.wind_gusts_10m[i] != null ? Math.round(fh.wind_gusts_10m[i]) : null)).join("");
  const windDirRow = slots.map((i) => cell(arrow(fh.wind_direction_10m[i]))).join("");
  const waveRow = slots
    .map((i) => {
      const m = marineByTime[fh.time[i]];
      const h = m?.height;
      const band = waveBand(h);
      return cell(h != null ? h.toFixed(1) : null, band !== null ? `wg-wave-${band}` : "");
    })
    .join("");
  const periodRow = slots
    .map((i) => {
      const m = marineByTime[fh.time[i]];
      return cell(m?.period != null ? Math.round(m.period) : null);
    })
    .join("");
  const waveDirRow = slots
    .map((i) => {
      const m = marineByTime[fh.time[i]];
      return cell(arrow(m?.dir));
    })
    .join("");
  const tempRow = slots.map((i) => cell(fh.temperature_2m[i] != null ? Math.round(fh.temperature_2m[i]) : null)).join("");
  const waterTempRow = slots
    .map((i) => {
      const m = marineByTime[fh.time[i]];
      return cell(m?.sst != null ? m.sst.toFixed(1) : null);
    })
    .join("");

  container.innerHTML = `
    <div class="wg-scroll">
      <table class="wg-table">
        <tbody>
          <tr><th>Día</th>${dayRow}</tr>
          <tr><th>Hora</th>${hourRow}</tr>
          <tr><th>Viento km/h</th>${windRow}</tr>
          <tr><th>Rachas km/h</th>${gustRow}</tr>
          <tr><th>Dir. viento</th>${windDirRow}</tr>
          <tr><th>Oleaje m</th>${waveRow}</tr>
          <tr><th>Periodo s</th>${periodRow}</tr>
          <tr><th>Dir. oleaje</th>${waveDirRow}</tr>
          <tr><th>Temp. aire °C</th>${tempRow}</tr>
          <tr><th>Temp. agua °C</th>${waterTempRow}</tr>
        </tbody>
      </table>
    </div>
  `;
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
  `;
}

function renderMareaPanel(forecast, marine) {
  const container = els("mareaPanel");
  if (!container) return;

  const mh = marine?.hourly;
  const tide = mh?.sea_level_height_msl ? computeTideInfo(mh.time, mh.sea_level_height_msl, findNearestHourIndex(mh.time)) : null;

  if (!tide) {
    container.innerHTML = `
      <p class="section-hint">Sin datos de marea disponibles para este punto ahora mismo.</p>
      <div class="marea-links">
        <a class="btn-link" href="${MAREA_URL}" target="_blank" rel="noopener noreferrer">Ver tabla completa (marea.ooo) ↗</a>
        <a class="btn-link btn-link-secondary" href="${TIDE_INFO_URL}" target="_blank" rel="noopener noreferrer">Predicción oficial IHM ↗</a>
      </div>
    `;
    return;
  }

  const extremesHtml = tide.extremes.length
    ? tide.extremes
        .map((ex) => `<li><strong>${ex.type === "pleamar" ? "Pleamar" : "Bajamar"}</strong> ${formatHour(ex.time)} · ${ex.height.toFixed(2)} m</li>`)
        .join("")
    : "<li>Sin próximos cambios de marea en el rango de datos.</li>";

  container.innerHTML = `
    <div class="marea-now">
      <div class="marea-now-value">${tide.nowHeight.toFixed(2)} <small>m sobre el nivel medio</small></div>
      <div class="marea-now-trend">${tide.trend === "subiendo" ? "⬆ Subiendo" : tide.trend === "bajando" ? "⬇ Bajando" : "—"}</div>
    </div>
    <ul class="marea-extremes">${extremesHtml}</ul>
    <div class="marea-links">
      <a class="btn-link" href="${MAREA_URL}" target="_blank" rel="noopener noreferrer">Ver gráfico completo (marea.ooo) ↗</a>
      <a class="btn-link btn-link-secondary" href="${TIDE_INFO_URL}" target="_blank" rel="noopener noreferrer">Predicción oficial IHM ↗</a>
    </div>
    <p class="marea-note">Calculada con el nivel del mar (incluye marea) del modelo marino de Open-Meteo, ~8 km de resolución: útil para hacerse una idea, pero no reemplaza la predicción oficial para navegación.</p>
  `;
}

function renderSurfWindows(forecast, marine) {
  const container = els("surfWindows");
  if (!container) return;
  const mh = marine?.hourly;
  const fh = forecast.hourly;
  if (!mh?.wave_height || !fh?.wind_speed_10m) {
    container.innerHTML = "";
    return;
  }

  const nowIdx = findNearestHourIndex(mh.time);
  const daily = forecast.daily;
  const series = buildSurfHourlySeries(
    mh.time,
    mh.wave_height,
    mh.wave_period,
    fh.time,
    fh.wind_speed_10m,
    fh.wind_direction_10m,
    nowIdx,
    30,
    daily ? { time: daily.time, sunrise: daily.sunrise, sunset: daily.sunset } : null
  );
  const windows = groupSurfWindows(series);

  let lastHeatDay = null;
  const heatmapHtml = series
    .map((rec, idx) => {
      const ratingKey = rec.score === null ? null : RATING_ORDER[rec.score];
      const barClass = ratingKey ? `surf-heat-${ratingKey}` : rec.daylight ? "surf-heat-na" : "surf-heat-night";
      const barHeight = rec.score === null ? 6 : 10 + rec.score * 10;
      const dayKey = rec.time.slice(0, 10);
      const isNewDay = dayKey !== lastHeatDay;
      lastHeatDay = dayKey;
      const showLabel = isNewDay || idx % 3 === 0;
      const hourLabel = isNewDay
        ? `${new Date(rec.time).toLocaleDateString("es-ES", { weekday: "short" })} ${formatHour(rec.time)}`
        : formatHour(rec.time);
      const title =
        rec.score === null
          ? rec.daylight
            ? "Sin datos"
            : `${formatHour(rec.time)}: de noche, sin luz`
          : `${formatHour(rec.time)}: ${describeSurfMoment(rec)}`;
      return `
        <div class="surf-heat-col ${isNewDay ? "surf-heat-newday" : ""}" title="${title}">
          <div class="surf-heat-bar ${barClass}" style="height:${barHeight}px"></div>
          <span class="surf-heat-hour">${showLabel ? hourLabel : ""}</span>
        </div>
      `;
    })
    .join("");

  const heatmapBlock = `
    <p class="surf-window-title">📈 Hora a hora (próximas ${series.length}h)</p>
    <div class="surf-heatmap"><div class="surf-heatmap-track">${heatmapHtml}</div></div>
    <p class="surf-heatmap-caption">Las barras azul oscuro son horas de noche: nunca se recomiendan, aunque el oleaje sea bueno sobre el papel.</p>
  `;

  if (!windows.length) {
    container.innerHTML = `
      ${heatmapBlock}
      <div class="surf-window-empty">No se esperan condiciones especialmente buenas para surfear en las próximas horas. Revisa la previsión de los próximos días.</div>
    `;
    return;
  }

  const todayKey = series[0]?.time.slice(0, 10);
  const windowsHtml = windows
    .map((w) => {
      const ratingKey = RATING_ORDER[Math.max(0, Math.min(3, Math.round(w.avgScore)))];
      const endDate = new Date(w.end);
      endDate.setHours(endDate.getHours() + 1);
      const endLabel = endDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      const dayKey = w.start.slice(0, 10);
      const dayLabel = dayKey === todayKey ? "Hoy" : new Date(w.start).toLocaleDateString("es-ES", { weekday: "long" });
      return `
        <div class="surf-window">
          <div class="surf-window-top">
            <span class="surf-window-time">${dayLabel}, ${formatHour(w.start)} – ${endLabel}</span>
            <span class="badge badge-${ratingKey}">${RATING_LABEL[ratingKey]}</span>
          </div>
          <p class="surf-window-why">Mejor momento sobre las <strong>${formatHour(w.peak.time)}</strong>: ${describeSurfMoment(w.peak)}.</p>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <p class="surf-window-title">🕐 Mejores franjas para surfear</p>
    <div class="surf-window-list">${windowsHtml}</div>
    ${heatmapBlock}
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
    renderWindguruTable(forecast, marine);
    renderDaily(forecast);
    renderSports(forecast, marine);
    renderSurfReport(forecast, marine);
    renderSurfWindows(forecast, marine);
    renderMareaPanel(forecast, marine);
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
