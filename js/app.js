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

function initLangSwitcher() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.lang === getLang());
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "light" || theme === "dark") root.setAttribute("data-theme", theme);
  else root.removeAttribute("data-theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const effective = theme || (prefersDark ? "dark" : "light");
  const btn = els("themeBtn");
  if (btn) btn.innerHTML = icon(effective === "dark" ? "sun" : "moon");
}

function initThemeToggle() {
  let theme = null;
  try {
    theme = localStorage.getItem("mc_theme");
  } catch (e) {
    /* localStorage puede estar bloqueado */
  }
  applyTheme(theme);
  els("themeBtn")?.addEventListener("click", () => {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const current = document.documentElement.getAttribute("data-theme") || (prefersDark ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem("mc_theme", next);
    } catch (e) {
      /* no pasa nada si no se puede persistir */
    }
  });
}

function initShareButton() {
  const btn = els("shareBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const text = t("share.text", {
      temp: els("airTemp")?.textContent ?? "--",
      wind: els("windSpeed")?.textContent ?? "--",
      wave: els("waveHeight")?.textContent ?? "--",
      water: els("waterTemp")?.textContent ?? "--",
    });
    const fullText = `${text} ${window.location.href}`;

    // navigator.share y navigator.clipboard solo existen en contexto seguro (https/localhost):
    // si se prueba la web por http:// en el móvil, ambas API faltan por completo. Probamos cada
    // opción por orden y, si ninguna existe o falla, dejamos como último recurso un cuadro con el
    // texto ya seleccionado para copiar a mano, así el botón nunca se queda sin hacer nada.
    if (navigator.share) {
      try {
        await navigator.share({ title: "MeteoCanteras", text, url: window.location.href });
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return;
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(fullText);
        showBanner(t("share.copied"));
        setTimeout(hideBanner, 2500);
        return;
      } catch (e) {
        /* seguimos al último recurso */
      }
    }

    window.prompt(t("share.copyManually"), fullText);
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
    const wetsuitKey = wetsuitRecommendationKey(mc.sea_surface_temperature);
    setText("wetsuitHint", wetsuitKey ? t(wetsuitKey) : "—");
  } else {
    ["waveHeight", "wavePeriod", "waveDir", "swellHeight", "swellPeriod", "swellDir", "waterTemp"].forEach((id) =>
      setText(id, "--")
    );
    setText("wetsuitHint", "—");
  }

  const mh = marine?.hourly;
  const tide = mh?.sea_level_height_msl ? computeTideInfo(mh.time, mh.sea_level_height_msl, findNearestHourIndex(mh.time)) : null;
  if (tide) {
    setText("tideHeight", tide.nowHeight.toFixed(2));
    setText("tideTrend", tide.trend === "subiendo" ? `↑ ${t("tide.rising")}` : tide.trend === "bajando" ? `↓ ${t("tide.falling")}` : "—");
    const next = tide.extremes[0];
    const nextType = next ? (next.type === "pleamar" ? t("tide.highTide") : t("tide.lowTide")) : "";
    setText("tideNext", next ? `${t("tide.next")} ${nextType}: ${formatHour(next.time)} (${next.height.toFixed(2)} m)` : "—");
  } else {
    setText("tideHeight", "--");
    setText("tideTrend", t("tide.noData"));
    setText("tideNext", t("tide.noDataSub"));
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
      <div class="wind">${icon("wind", "icon-xs")} ${Math.round(h.wind_speed_10m[i])} km/h</div>
      ${wave !== undefined && wave !== null ? `<div class="wave">${icon("waves", "icon-xs")} ${wave.toFixed(1)} m</div>` : ""}
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
    container.innerHTML = `<p class="section-hint">${t("forecast.tableEmpty")}</p>`;
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
      const label = isNewDay ? new Date(fh.time[i]).toLocaleDateString(getLocale(), { weekday: "short", day: "numeric" }) : "";
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
          <tr><th>${t("wg.row.day")}</th>${dayRow}</tr>
          <tr><th>${t("wg.row.hour")}</th>${hourRow}</tr>
          <tr><th>${t("wg.row.wind")}</th>${windRow}</tr>
          <tr><th>${t("wg.row.gusts")}</th>${gustRow}</tr>
          <tr><th>${t("wg.row.windDir")}</th>${windDirRow}</tr>
          <tr><th>${t("wg.row.waves")}</th>${waveRow}</tr>
          <tr><th>${t("wg.row.period")}</th>${periodRow}</tr>
          <tr><th>${t("wg.row.waveDir")}</th>${waveDirRow}</tr>
          <tr><th>${t("wg.row.tempAir")}</th>${tempRow}</tr>
          <tr><th>${t("wg.row.tempWater")}</th>${waterTempRow}</tr>
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
      <div class="day-wind">${icon("wind", "icon-xs")} ${Math.round(d.wind_speed_10m_max[i])} km/h</div>
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
      <span class="surf-stat-label">${t("surf.swellHeight")}</span>
      <span class="surf-stat-value">${fmt(report.swellHeight)} m</span>
      <span class="surf-stat-sub">${t("card.waves.period")} ${fmt(report.swellPeriod, 0)} s</span>
    </div>
    <div class="surf-stat">
      <span class="surf-stat-label">${t("surf.swellType")}</span>
      <span class="surf-stat-value surf-stat-text">${report.periodType}</span>
    </div>
    <div class="surf-stat">
      <span class="surf-stat-label">${t("surf.power")}</span>
      <span class="surf-stat-value">${fmt(report.power, 1)} <small>kW/m</small></span>
      <span class="badge badge-${report.powerClass}">${report.powerLabel}</span>
    </div>
    <div class="surf-stat">
      <span class="surf-stat-label">${t("surf.direction")}</span>
      <span class="surf-stat-value surf-stat-text">${report.directionMatch}</span>
    </div>
    <div class="surf-stat">
      <span class="surf-stat-label">${t("surf.wind")}</span>
      <span class="surf-stat-value">${fmt(report.windSpeed, 0)} <small>km/h</small></span>
      <span class="surf-stat-sub">${report.windType}${report.windDir !== null ? ` · ${degreesToCompass(report.windDir)}` : ""}</span>
    </div>
  `;
}

// Curva de marea en SVG: sin librerías, un polyline suavizado con sombreado de noche, marcador de
// "ahora" y las pleamares/bajamares del rango marcadas.
function buildTideChartSvg(times, heights, nowIdx, daily) {
  // El viewBox se escala siempre de forma uniforme (misma proporción ancho/alto que el hueco
  // real en pantalla, ver CSS `aspect-ratio`); si se escalase de forma distinta en cada eje,
  // los círculos de los marcadores saldrían como óvalos.
  const width = 480;
  const height = 110;
  const padTop = 22;
  const padBottom = 18;
  const plotH = height - padTop - padBottom;

  const startIdx = Math.max(0, nowIdx - 6);
  const endIdx = Math.min(times.length - 1, nowIdx + 24);
  const idxs = [];
  for (let i = startIdx; i <= endIdx; i++) {
    if (heights[i] !== null && heights[i] !== undefined) idxs.push(i);
  }
  if (idxs.length < 2) return "";

  const vals = idxs.map((i) => heights[i]);
  const minH = Math.min(...vals);
  const maxH = Math.max(...vals);
  const range = Math.max(0.2, maxH - minH);

  const xAt = (pos) => (pos / (idxs.length - 1)) * width;
  const yAt = (h) => padTop + plotH - ((h - minH) / range) * plotH;

  const points = idxs.map((i, pos) => ({ x: xAt(pos), y: yAt(heights[i]), i }));

  // Sombreado de horas sin luz solar, agrupando tramos contiguos.
  let nightRects = "";
  if (daily?.time && daily?.sunrise && daily?.sunset) {
    let runStart = null;
    points.forEach((p, pos) => {
      const dark = !isDaylight(times[p.i], daily.time, daily.sunrise, daily.sunset);
      if (dark && runStart === null) runStart = p.x;
      if (!dark && runStart !== null) {
        nightRects += `<rect x="${runStart.toFixed(1)}" y="0" width="${(p.x - runStart).toFixed(1)}" height="${height}" class="tide-chart-night"/>`;
        runStart = null;
      }
      if (dark && pos === points.length - 1) {
        nightRects += `<rect x="${runStart.toFixed(1)}" y="0" width="${(width - runStart).toFixed(1)}" height="${height}" class="tide-chart-night"/>`;
      }
    });
  }

  // Curva suavizada: L al primer punto medio, luego una Q por punto usando el siguiente punto
  // medio como destino (evita tener que implementar Catmull-Rom completo).
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let k = 0; k < points.length - 1; k++) {
    const mx = (points[k].x + points[k + 1].x) / 2;
    const my = (points[k].y + points[k + 1].y) / 2;
    path += ` Q ${points[k].x.toFixed(1)} ${points[k].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  path += ` L ${points[points.length - 1].x.toFixed(1)} ${points[points.length - 1].y.toFixed(1)}`;

  const areaPath = `${path} L ${points[points.length - 1].x.toFixed(1)} ${height - padBottom} L ${points[0].x.toFixed(1)} ${height - padBottom} Z`;

  const extremes = findExtremesInRange(times, heights, startIdx, endIdx);
  const extremeMarks = extremes
    .map((ex) => {
      const pos = idxs.indexOf(ex.index);
      if (pos === -1) return "";
      const x = xAt(pos);
      const y = yAt(ex.height);
      const labelY = ex.type === "pleamar" ? y - 12 : y + 22;
      return `
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" class="tide-chart-dot"/>
        <text x="${x.toFixed(1)}" y="${labelY.toFixed(1)}" class="tide-chart-label" text-anchor="middle">${formatHour(ex.time)}</text>
      `;
    })
    .join("");

  const nowPos = idxs.indexOf(nowIdx);
  const nowMark =
    nowPos !== -1
      ? `
        <line x1="${points[nowPos].x.toFixed(1)}" y1="0" x2="${points[nowPos].x.toFixed(1)}" y2="${height}" class="tide-chart-now-line"/>
        <circle cx="${points[nowPos].x.toFixed(1)}" cy="${points[nowPos].y.toFixed(1)}" r="6" class="tide-chart-now-dot"/>
      `
      : "";

  return `
    <svg class="tide-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${t("card.tide")}">
      ${nightRects}
      <path d="${areaPath}" class="tide-chart-area"/>
      <path d="${path}" class="tide-chart-line"/>
      ${extremeMarks}
      ${nowMark}
    </svg>
  `;
}

function renderRipRisk(forecast, marine) {
  const container = els("ripRisk");
  if (!container) return;
  const mc = marine?.current;
  const cur = forecast.current || {};
  const mh = marine?.hourly;
  const tide = mh?.sea_level_height_msl ? computeTideInfo(mh.time, mh.sea_level_height_msl, findNearestHourIndex(mh.time)) : null;

  const risk = computeRipRisk({
    waveHeight: mc?.wave_height ?? null,
    tideHeight: tide?.nowHeight ?? null,
    windSpeed: cur.wind_speed_10m ?? null,
    windDir: cur.wind_direction_10m ?? null,
  });

  const reasonsText = risk.reasons.length ? `${t("riprisk.reasonPrefix")} ${risk.reasons.map((r) => t(r)).join(", ")}.` : t("riprisk.noReasons");

  container.innerHTML = `
    <div class="riprisk-card">
      <div class="riprisk-top">
        <span class="riprisk-title">${icon("lifebuoy", "icon-sm")} ${t("riprisk.title")}</span>
        <span class="badge badge-${risk.badgeClass}">${t(`riprisk.${risk.level}`)}</span>
      </div>
      <p class="riprisk-reasons">${reasonsText}</p>
      <p class="riprisk-hint">${t("riprisk.hint")}</p>
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
      <p class="section-hint">${t("tide.noDataPanel")}</p>
      <div class="marea-links">
        <a class="btn-link" href="${MAREA_URL}" target="_blank" rel="noopener noreferrer">${t("tide.fullChart")} ↗</a>
        <a class="btn-link btn-link-secondary" href="${TIDE_INFO_URL}" target="_blank" rel="noopener noreferrer">${t("tide.official")} ↗</a>
      </div>
    `;
    return;
  }

  const extremesHtml = tide.extremes.length
    ? tide.extremes
        .map(
          (ex) =>
            `<li><strong>${ex.type === "pleamar" ? t("tide.highTide") : t("tide.lowTide")}</strong> ${formatHour(ex.time)} · ${ex.height.toFixed(2)} m</li>`
        )
        .join("")
    : `<li>${t("tide.noExtremes")}</li>`;

  const nowIdx = findNearestHourIndex(mh.time);
  const daily = forecast.daily;
  const chartSvg = buildTideChartSvg(mh.time, mh.sea_level_height_msl, nowIdx, daily ? { time: daily.time, sunrise: daily.sunrise, sunset: daily.sunset } : null);

  container.innerHTML = `
    <div class="marea-now">
      <div class="marea-now-value">${tide.nowHeight.toFixed(2)} <small>${t("tide.above")}</small></div>
      <div class="marea-now-trend">${tide.trend === "subiendo" ? `↑ ${t("tide.rising")}` : tide.trend === "bajando" ? `↓ ${t("tide.falling")}` : "—"}</div>
    </div>
    ${chartSvg}
    <ul class="marea-extremes">${extremesHtml}</ul>
    <div class="marea-links">
      <a class="btn-link" href="${MAREA_URL}" target="_blank" rel="noopener noreferrer">${t("tide.fullChart")} ↗</a>
      <a class="btn-link btn-link-secondary" href="${TIDE_INFO_URL}" target="_blank" rel="noopener noreferrer">${t("tide.official")} ↗</a>
    </div>
    <p class="marea-note">${t("tide.note")}</p>
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
    mh.swell_wave_height,
    mh.swell_wave_period,
    fh.time,
    fh.wind_speed_10m,
    fh.wind_direction_10m,
    nowIdx,
    30,
    daily ? { time: daily.time, sunrise: daily.sunrise, sunset: daily.sunset } : null
  );
  const windows = groupSurfWindows(series);

  let lastHeatDay = null;
  let hoursSinceLabel = 99;
  const heatmapHtml = series
    .map((rec) => {
      const ratingKey = rec.score === null ? null : RATING_ORDER[rec.score];
      const barClass = ratingKey ? `surf-heat-${ratingKey}` : rec.daylight ? "surf-heat-na" : "surf-heat-night";
      const dayKey = rec.time.slice(0, 10);
      const isNewDay = dayKey !== lastHeatDay;
      lastHeatDay = dayKey;
      // Espacio mínimo de 3h entre etiquetas para que no se solapen, aunque un cambio de día
      // fuerce una fuera de ese ritmo.
      const showLabel = isNewDay || hoursSinceLabel >= 3;
      hoursSinceLabel = showLabel ? 0 : hoursSinceLabel + 1;
      const hourLabel = isNewDay ? `${new Date(rec.time).toLocaleDateString(getLocale(), { weekday: "short" })} ${formatHour(rec.time)}` : formatHour(rec.time);
      const title =
        rec.score === null
          ? rec.daylight
            ? t("sports.heatmap.noData")
            : `${formatHour(rec.time)}: ${t("sports.heatmap.night")}`
          : `${formatHour(rec.time)}: ${describeSurfMoment(rec)}`;
      return `
        <div class="surf-heat-col ${isNewDay ? "surf-heat-newday" : ""}" title="${title}">
          <div class="surf-heat-bar ${barClass}"></div>
          <span class="surf-heat-hour">${showLabel ? hourLabel : ""}</span>
        </div>
      `;
    })
    .join("");

  const heatLegendItems = [
    ["excelente", ratingLabel("excelente")],
    ["bueno", ratingLabel("bueno")],
    ["regular", ratingLabel("regular")],
    ["malo", ratingLabel("malo")],
    ["night", t("sports.heatmap.legendNight")],
  ];
  const heatLegend = heatLegendItems
    .map(([key, label]) => `<span class="surf-heat-legend-item"><i class="surf-heat-legend-swatch surf-heat-${key === "night" ? "night" : key}"></i>${label}</span>`)
    .join("");

  const heatmapBlock = `
    <p class="surf-window-title">${icon("chart", "icon-sm")} ${t("sports.heatmap.title", { n: series.length })}</p>
    <div class="surf-heatmap">
      <div class="surf-heat-legend">${heatLegend}</div>
      <div class="surf-heatmap-track">${heatmapHtml}</div>
    </div>
    <p class="surf-heatmap-caption">${t("sports.heatmap.caption")}</p>
  `;

  if (!windows.length) {
    container.innerHTML = `
      ${heatmapBlock}
      <div class="surf-window-empty">${t("sports.windows.empty")}</div>
    `;
    return;
  }

  const todayKey = series[0]?.time.slice(0, 10);
  const windowsHtml = windows
    .map((w) => {
      const ratingKey = RATING_ORDER[Math.max(0, Math.min(3, Math.round(w.avgScore)))];
      const endDate = new Date(w.end);
      endDate.setHours(endDate.getHours() + 1);
      const endLabel = endDate.toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" });
      const dayKey = w.start.slice(0, 10);
      const dayLabel = dayKey === todayKey ? t("sports.windows.today") : new Date(w.start).toLocaleDateString(getLocale(), { weekday: "long" });
      return `
        <div class="surf-window">
          <div class="surf-window-top">
            <span class="surf-window-time">${dayLabel}, ${formatHour(w.start)} – ${endLabel}</span>
            <span class="badge badge-${ratingKey}">${ratingLabel(ratingKey)}</span>
          </div>
          <p class="surf-window-why">${t("sports.windows.bestAround")} <strong>${formatHour(w.peak.time)}</strong>: ${describeSurfMoment(w.peak)}.</p>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <p class="surf-window-title">${icon("clock", "icon-sm")} ${t("sports.windows.title")}</p>
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
      <p class="embed-name">${icon("pin", "icon-xs")} ${cam.name} <span class="embed-zone">· ${cam.zone}</span></p>
      <div class="embed-frame-wrap">
        <iframe
          src="https://webcams.windy.com/webcams/public/embed/player/${cam.id}/live"
          loading="lazy"
          allowfullscreen
          referrerpolicy="no-referrer-when-downgrade"
          title="${cam.name}"
        ></iframe>
      </div>
      <a class="embed-fallback-link" href="${cam.pageUrl}" target="_blank" rel="noopener noreferrer">${t("cameras.notLoading")} ↗</a>
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
        <div class="sport-name">${icon(sport.icon, "icon-sm")} ${sport.name}</div>
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
        ${icon(cam.icon, "icon-sm")}
        <span class="webcam-name">${cam.name}</span>
      </div>
      <p class="webcam-zone">${icon("pin", "icon-xs")} ${cam.zone}</p>
      <p class="webcam-desc">${tr(cam.desc)}</p>
      <span class="webcam-link">${t("cameras.viewLive")} ↗</span>
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
      <p>${tr(zone.desc)}</p>
      <div class="zone-tags">${tr(zone.tags)
        .map((tag) => `<span class="zone-tag">${tag}</span>`)
        .join("")}</div>
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
    renderRipRisk(forecast, marine);
    setText("lastUpdated", new Date().toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" }));
    if (marineError) {
      showBanner(t("error.marine"));
    }
  } catch (err) {
    console.error(err);
    showBanner(t("error.general"));
  }
}

function init() {
  applyStaticI18n();
  initTabs();
  initLangSwitcher();
  initThemeToggle();
  initShareButton();
  renderEmbedWebcams();
  renderWebcams();
  renderZones();
  loadAll();
  els("refreshBtn")?.addEventListener("click", loadAll);
  setInterval(loadAll, AUTO_REFRESH_MINUTES * 60 * 1000);
}

document.addEventListener("DOMContentLoaded", init);
