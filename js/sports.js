// Reglas de aptitud orientativas (no oficiales) para deportes acuáticos en Las Canteras.
const RATING_ORDER = ["malo", "regular", "bueno", "excelente"];

function isOnshoreWind(dirDeg) {
  // Las Canteras mira aprox. al N/NNE: viento de componente N-NE-E suele entrar de cara ("onshore").
  if (dirDeg === null || dirDeg === undefined) return false;
  return dirDeg >= 315 || dirDeg <= 90;
}

function isOffshoreWind(dirDeg) {
  // Componente S/SW sopla desde tierra hacia el mar ("offshore"), suele limpiar el oleaje.
  if (dirDeg === null || dirDeg === undefined) return false;
  return dirDeg >= 135 && dirDeg <= 225;
}

function clampRatingIndex(idx) {
  return Math.max(0, Math.min(RATING_ORDER.length - 1, idx));
}

// Potencia de ola aproximada (fórmula estándar de previsión de surf): P ≈ 0.5 · Hs² · Tp, en kW/m.
function estimateWavePowerKw(heightM, periodS) {
  if (heightM === null || heightM === undefined || periodS === null || periodS === undefined) return null;
  return 0.5 * heightM * heightM * periodS;
}

function wavePowerLabel(kw) {
  if (kw === null) return { key: "power.noData", cls: "regular" };
  if (kw < 3) return { key: "power.flat", cls: "malo" };
  if (kw < 8) return { key: "power.soft", cls: "regular" };
  if (kw < 15) return { key: "power.firm", cls: "bueno" };
  if (kw < 25) return { key: "power.strong", cls: "excelente" };
  return { key: "power.hazard", cls: "malo" };
}

function swellPeriodTypeKey(periodS) {
  if (periodS === null || periodS === undefined) return "period.noData";
  if (periodS < 8) return "period.wind";
  if (periodS <= 12) return "period.medium";
  return "period.ground";
}

function swellDirectionMatchKey(dirDeg) {
  if (dirDeg === null || dirDeg === undefined) return "dir.noData";
  // La Barra / El Confital reciben mejor los swells de componente N a NE.
  const goodMatch = dirDeg >= 300 || dirDeg <= 60;
  return goodMatch ? "dir.goodFit" : "dir.lessTypical";
}

function windTypeKey(dirDeg) {
  if (dirDeg === null || dirDeg === undefined) return "wind.noData";
  if (isOffshoreWind(dirDeg)) return "wind.offshore";
  if (isOnshoreWind(dirDeg)) return "wind.onshore";
  return "wind.cross";
}

const SPORT_STRINGS = {
  es: {
    "power.noData": "Sin datos",
    "power.flat": "Plana / muy pequeña",
    "power.soft": "Suave",
    "power.firm": "Con fuerza",
    "power.strong": "Potente",
    "power.hazard": "Muy potente (peligrosa)",
    "period.noData": "Sin datos",
    "period.wind": "Swell de viento (corto, más desordenado)",
    "period.medium": "Periodo medio",
    "period.ground": "Mar de fondo (groundswell, olas más limpias y potentes)",
    "dir.noData": "Sin datos de dirección.",
    "dir.goodFit": "Buena orientación para romper en La Barra / El Confital.",
    "dir.lessTypical": "Orientación menos habitual para las rompientes de Las Canteras.",
    "wind.noData": "Sin datos",
    "wind.offshore": "Terral (offshore) — limpia la ola",
    "wind.onshore": "De cara (onshore) — desordena la ola",
    "wind.cross": "Cruzado (cross-shore)",
    "sport.surf": "Surf",
    "sport.bodyboard": "Bodyboard",
    "sport.sup": "Paddle surf (SUP)",
    "sport.swim": "Natación / baño",
    "sport.dive": "Buceo / snorkel",
  },
  en: {
    "power.noData": "No data",
    "power.flat": "Flat / very small",
    "power.soft": "Soft",
    "power.firm": "Firm",
    "power.strong": "Strong",
    "power.hazard": "Very strong (hazardous)",
    "period.noData": "No data",
    "period.wind": "Wind swell (short, choppier)",
    "period.medium": "Medium period",
    "period.ground": "Groundswell (cleaner, more powerful waves)",
    "dir.noData": "No direction data.",
    "dir.goodFit": "Good fit for the La Barra / El Confital break.",
    "dir.lessTypical": "Less typical direction for the Las Canteras breaks.",
    "wind.noData": "No data",
    "wind.offshore": "Offshore — cleans up the wave",
    "wind.onshore": "Onshore — messes up the wave",
    "wind.cross": "Cross-shore",
    "sport.surf": "Surf",
    "sport.bodyboard": "Bodyboard",
    "sport.sup": "Paddle surfing (SUP)",
    "sport.swim": "Swimming",
    "sport.dive": "Diving / snorkelling",
  },
};

function st(key) {
  const dict = SPORT_STRINGS[getLang()] || SPORT_STRINGS.es;
  return dict[key] ?? SPORT_STRINGS.es[key] ?? key;
}

function computeSurfReport(d) {
  const waveH = d.waveHeight ?? null;
  const wavePer = d.wavePeriod ?? null;
  const swellH = d.swellHeight ?? waveH;
  const swellPer = d.swellPeriod ?? wavePer;
  const swellDir = d.swellDir ?? d.waveDir ?? null;
  const power = estimateWavePowerKw(swellH, swellPer);
  const powerInfo = wavePowerLabel(power);

  return {
    swellHeight: swellH,
    swellPeriod: swellPer,
    periodType: st(swellPeriodTypeKey(swellPer)),
    power,
    powerLabel: st(powerInfo.key),
    powerClass: powerInfo.cls,
    directionMatch: st(swellDirectionMatchKey(swellDir)),
    windType: st(windTypeKey(d.windDir)),
    windSpeed: d.windSpeed ?? null,
    windGust: d.windGust ?? null,
    windDir: d.windDir ?? null,
  };
}

// Estado de marea a partir de sea_level_height_msl (nivel del mar horario de Open-Meteo).
// Sin astronomía propia: busca la tendencia actual y los próximos cambios de sentido (extremos)
// directamente en la serie horaria que ya devuelve la API.
function computeTideInfo(times, heights, nowIndex) {
  if (!times || !heights || nowIndex === null || nowIndex === undefined) return null;
  const nowHeight = heights[nowIndex];
  if (nowHeight === null || nowHeight === undefined) return null;

  let trend = null;
  if (heights[nowIndex + 1] !== null && heights[nowIndex + 1] !== undefined) {
    trend = heights[nowIndex + 1] > nowHeight ? "subiendo" : "bajando";
  } else if (nowIndex > 0 && heights[nowIndex - 1] !== null && heights[nowIndex - 1] !== undefined) {
    trend = nowHeight > heights[nowIndex - 1] ? "subiendo" : "bajando";
  }

  const extremes = [];
  let prevSign = null;
  for (let i = nowIndex; i < heights.length - 1 && extremes.length < 2; i++) {
    if (heights[i] === null || heights[i + 1] === null || heights[i] === undefined || heights[i + 1] === undefined) continue;
    const diff = heights[i + 1] - heights[i];
    if (diff === 0) continue;
    const sign = diff > 0 ? 1 : -1;
    if (prevSign !== null && sign !== prevSign) {
      extremes.push({ type: prevSign > 0 ? "pleamar" : "bajamar", time: times[i], height: heights[i] });
    }
    prevSign = sign;
  }

  return { nowHeight, trend, extremes };
}

// Puntuación horaria simplificada de surf (mismos criterios que la tarjeta de Surf) para poder
// comparar muchas horas seguidas y encontrar la mejor franja del día.
function scoreSurfHour(waveH, wavePer, windSpeed, windDir) {
  if (waveH === null || waveH === undefined) return null;
  let score;
  if (waveH < 0.3) score = 0;
  else if (waveH < 0.6) score = 1;
  else if (waveH <= 2.2) score = wavePer && wavePer >= 8 ? 3 : 2;
  else if (waveH <= 3) score = 1;
  else score = 0;
  if (windSpeed !== null && windSpeed !== undefined && isOnshoreWind(windDir) && windSpeed > 20) {
    score = Math.max(0, score - 1);
  }
  return score;
}

// ¿Hay luz solar a esa hora? Sin esto, el oleaje puede ser bueno a medianoche y el algoritmo lo
// recomendaría igualmente, lo cual no tiene ningún sentido para surfear.
function isDaylight(timeStr, dailyTime, sunrise, sunset) {
  if (!dailyTime || !sunrise || !sunset) return true;
  const dayIdx = dailyTime.indexOf(timeStr.slice(0, 10));
  if (dayIdx === -1) return true;
  const t = new Date(timeStr).getTime();
  const sr = new Date(sunrise[dayIdx]).getTime();
  const ss = new Date(sunset[dayIdx]).getTime();
  return t >= sr && t <= ss;
}

// Serie hora a hora (oleaje + viento + puntuación) de las próximas horas: es la base tanto del
// mini-gráfico como de las franjas recomendadas, para que ambos cuenten la misma historia.
// Las horas sin luz solar quedan sin puntuación: nunca se recomienda surfear de noche por muy
// bueno que esté el oleaje sobre el papel.
function buildSurfHourlySeries(marineTimes, waveHeights, wavePeriods, windTimes, windSpeeds, windDirs, startIndex, hoursAhead, daylight) {
  const windByTime = {};
  windTimes.forEach((t, i) => {
    windByTime[t] = { speed: windSpeeds[i], dir: windDirs[i] };
  });

  const series = [];
  const endIndex = Math.min(startIndex + hoursAhead, marineTimes.length);
  for (let i = startIndex; i < endIndex; i++) {
    const wind = windByTime[marineTimes[i]] || {};
    const waveH = waveHeights[i] ?? null;
    const wavePer = wavePeriods[i] ?? null;
    const hasDaylight = isDaylight(marineTimes[i], daylight?.time, daylight?.sunrise, daylight?.sunset);
    series.push({
      time: marineTimes[i],
      waveH,
      wavePer,
      windSpeed: wind.speed ?? null,
      windDir: wind.dir ?? null,
      daylight: hasDaylight,
      score: hasDaylight ? scoreSurfHour(waveH, wavePer, wind.speed, wind.dir) : null,
    });
  }
  return series;
}

// Agrupa las horas seguidas de buenas condiciones (score >= 2) en franjas, sin cruzar nunca la
// medianoche, y dentro de cada una identifica la hora "pico" (la de mejor puntuación) para poder
// justificar la recomendación con datos concretos en vez de solo un rango horario.
function groupSurfWindows(series) {
  const windows = [];
  let current = null;
  series.forEach((rec) => {
    const sameDayAsCurrent = current && rec.time.slice(0, 10) === current[0].time.slice(0, 10);
    if (rec.score !== null && rec.score >= 2 && (!current || sameDayAsCurrent)) {
      if (!current) current = [rec];
      else current.push(rec);
    } else {
      if (current) windows.push(current);
      // Si cambia el día pero esta hora también es buena, empieza ya la franja del día siguiente
      // en vez de descartarla.
      current = rec.score !== null && rec.score >= 2 ? [rec] : null;
    }
  });
  if (current) windows.push(current);

  return windows
    .map((records) => {
      const avgScore = records.reduce((a, r) => a + r.score, 0) / records.length;
      const peak = records.reduce((best, r) => (r.score > best.score ? r : best), records[0]);
      return {
        start: records[0].time,
        end: records[records.length - 1].time,
        hours: records.length,
        avgScore,
        peak,
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore || b.hours - a.hours)
    .slice(0, 2);
}

// Frase corta con los datos concretos de una hora, para explicar "por qué" es un buen momento.
// El orden de las palabras cambia entre idiomas, así que se construye la frase completa por
// idioma en vez de traducir fragmentos sueltos.
function describeSurfMoment(rec) {
  const lang = getLang();
  const hasWave = rec.waveH !== null;
  const hasWind = rec.windSpeed !== null;
  if (!hasWave && !hasWind) {
    return lang === "en" ? "not enough data to explain this" : "sin datos suficientes para justificarlo";
  }

  const windKind = isOffshoreWind(rec.windDir) ? "offshore" : isOnshoreWind(rec.windDir) ? "onshore" : "cross";

  if (lang === "en") {
    const parts = [];
    if (hasWave) parts.push(`${rec.waveH.toFixed(1)} m swell${rec.wavePer ? `, ${Math.round(rec.wavePer)} s period` : ""}`);
    if (hasWind) {
      const windLabel = windKind === "offshore" ? "offshore wind (cleans up the wave)" : windKind === "onshore" ? "onshore wind" : "cross-shore wind";
      parts.push(`${Math.round(rec.windSpeed)} km/h ${windLabel}`);
    }
    return parts.join(", ");
  }

  const parts = [];
  if (hasWave) parts.push(`oleaje de ${rec.waveH.toFixed(1)} m${rec.wavePer ? ` y periodo ${Math.round(rec.wavePer)} s` : ""}`);
  if (hasWind) {
    const windLabel = windKind === "offshore" ? "de tierra (limpia la ola)" : windKind === "onshore" ? "de cara" : "cruzado";
    parts.push(`viento ${windLabel} de ${Math.round(rec.windSpeed)} km/h`);
  }
  return parts.join(", ");
}

function computeSportRatings(d) {
  const lang = getLang();
  const wind = d.windSpeed ?? 0;
  const windDir = d.windDir;
  const waveH = d.waveHeight ?? null;
  const wavePer = d.wavePeriod ?? null;
  const swellH = d.swellHeight ?? waveH;
  const swellPer = d.swellPeriod ?? wavePer;
  const hasMarine = waveH !== null && waveH !== undefined;

  const sports = [];

  // --- SURF ---
  {
    const h = swellH ?? waveH;
    const per = swellPer ?? wavePer;
    let idx;
    let why;
    if (!hasMarine || h === null) {
      idx = null;
      why = lang === "en" ? "No swell data available right now." : "Sin datos de oleaje disponibles ahora mismo.";
    } else if (h < 0.3) {
      idx = 0;
      why =
        lang === "en"
          ? `Almost flat sea (${h.toFixed(1)} m). No rideable waves.`
          : `Mar casi plana (${h.toFixed(1)} m). No hay olas para surfear.`;
    } else if (h < 0.6) {
      idx = 1;
      why =
        lang === "en"
          ? `Small swell (${h.toFixed(1)} m), only OK for beginners at La Barra.`
          : `Oleaje pequeño (${h.toFixed(1)} m), aceptable solo para iniciación en La Barra.`;
    } else if (h <= 2.2) {
      idx = per && per >= 8 ? 3 : 2;
      why =
        lang === "en"
          ? `${h.toFixed(1)} m swell, ${per ? per.toFixed(0) : "?"} s period, at La Barra / El Confital.`
          : `Oleaje de ${h.toFixed(1)} m con periodo ${per ? per.toFixed(0) : "?"} s en La Barra / El Confital.`;
    } else if (h <= 3) {
      idx = 1;
      why =
        lang === "en"
          ? `Big swell (${h.toFixed(1)} m): advanced surfers only.`
          : `Mar de fondo grande (${h.toFixed(1)} m): solo nivel avanzado.`;
    } else {
      idx = 0;
      why =
        lang === "en"
          ? `Very large swell (${h.toFixed(1)} m): hazardous conditions, not recommended.`
          : `Oleaje muy grande (${h.toFixed(1)} m): condición de riesgo, no recomendado.`;
    }
    if (idx !== null && isOnshoreWind(windDir) && wind > 20) {
      idx = clampRatingIndex(idx - 1);
      why += lang === "en" ? " Onshore wind may mess up the wave." : " Viento de cara que puede desordenar la ola.";
    } else if (idx !== null && isOffshoreWind(windDir) && wind < 25) {
      why += lang === "en" ? " Offshore wind helps clean up the wave." : " Viento de tierra, ayuda a limpiar la ola.";
    }
    sports.push({ key: "surf", name: st("sport.surf"), icon: "surfboard", idx, why });
  }

  // --- BODYBOARD ---
  {
    const h = waveH;
    let idx, why;
    if (!hasMarine || h === null) {
      idx = null;
      why = lang === "en" ? "No swell data available right now." : "Sin datos de oleaje disponibles ahora mismo.";
    } else if (h < 0.3) {
      idx = 1;
      why = lang === "en" ? `Waves too small (${h.toFixed(1)} m) for bodyboarding.` : `Olas muy pequeñas (${h.toFixed(1)} m) para bodyboard.`;
    } else if (h <= 1.6) {
      idx = 3;
      why =
        lang === "en"
          ? `Good wave size (${h.toFixed(1)} m) for bodyboarding on the north shore.`
          : `Buen tamaño de ola (${h.toFixed(1)} m) para bodyboard en la orilla norte.`;
    } else if (h <= 2.5) {
      idx = 2;
      why = lang === "en" ? `Big waves (${h.toFixed(1)} m), recommended with experience.` : `Olas grandes (${h.toFixed(1)} m), recomendable con experiencia.`;
    } else {
      idx = 0;
      why = lang === "en" ? `Excessive swell (${h.toFixed(1)} m) for safe bodyboarding.` : `Oleaje excesivo (${h.toFixed(1)} m) para bodyboard seguro.`;
    }
    sports.push({ key: "bodyboard", name: st("sport.bodyboard"), icon: "waves", idx, why });
  }

  // --- PADDLE SURF (SUP) ---
  {
    let idx, why;
    const h = waveH ?? 0;
    if (wind < 12 && h < 0.5) {
      idx = 3;
      why = lang === "en" ? `Calm sea and light wind (${wind.toFixed(0)} km/h): ideal for SUP.` : `Mar en calma y viento suave (${wind.toFixed(0)} km/h): ideal para SUP.`;
    } else if (wind < 20 && h < 1) {
      idx = 2;
      why = lang === "en" ? `Moderate conditions (${wind.toFixed(0)} km/h wind), manageable with care.` : `Condiciones moderadas (viento ${wind.toFixed(0)} km/h), navegable con cuidado.`;
    } else if (wind < 28) {
      idx = 1;
      why = lang === "en" ? `Noticeable wind (${wind.toFixed(0)} km/h), hard to paddle in a straight line.` : `Viento notable (${wind.toFixed(0)} km/h), complicado para remar en línea recta.`;
    } else {
      idx = 0;
      why = lang === "en" ? `Strong wind (${wind.toFixed(0)} km/h): drift risk, not recommended.` : `Viento fuerte (${wind.toFixed(0)} km/h): riesgo de deriva, no recomendado.`;
    }
    sports.push({ key: "sup", name: st("sport.sup"), icon: "paddle", idx, why });
  }

  // --- NATACIÓN / BAÑO ---
  {
    const h = waveH ?? 0;
    let idx, why;
    if (!hasMarine) {
      idx = wind < 20 ? 2 : 1;
      why = lang === "en" ? "No swell data; rated on wind alone." : "Sin datos de oleaje; valorado solo con el viento.";
    } else if (h < 0.5) {
      idx = 3;
      why = lang === "en" ? `Calm sea (${h.toFixed(1)} m), good for swimming in the sheltered central section.` : `Mar tranquila (${h.toFixed(1)} m), buena para nadar en la zona central protegida.`;
    } else if (h < 1) {
      idx = 2;
      why = lang === "en" ? `Some swell (${h.toFixed(1)} m), swim with care.` : `Algo de oleaje (${h.toFixed(1)} m), báñate con precaución.`;
    } else if (h < 1.5) {
      idx = 1;
      why = lang === "en" ? `Moderate swell (${h.toFixed(1)} m), watch out for currents.` : `Oleaje moderado (${h.toFixed(1)} m), cuidado con las corrientes.`;
    } else {
      idx = 0;
      why = lang === "en" ? `Significant swell (${h.toFixed(1)} m): not recommended for a calm swim.` : `Oleaje considerable (${h.toFixed(1)} m): no recomendado para el baño tranquilo.`;
    }
    sports.push({ key: "swim", name: st("sport.swim"), icon: "swimmer", idx, why });
  }

  // --- BUCEO / SNORKEL ---
  {
    const h = waveH ?? 0;
    let idx, why;
    if (wind < 15 && h < 0.6) {
      idx = 3;
      why = lang === "en" ? "Calm sea, good visibility expected around Peña La Vieja." : "Mar en calma, buena visibilidad esperable en Peña La Vieja.";
    } else if (wind < 22 && h < 1) {
      idx = 2;
      why = lang === "en" ? "Acceptable conditions, some movement at the surface." : "Condiciones aceptables, algo de movimiento en superficie.";
    } else if (wind < 30) {
      idx = 1;
      why = lang === "en" ? "Quite a bit of movement; visibility may worsen due to swell." : "Bastante movimiento, la visibilidad puede empeorar por el oleaje.";
    } else {
      idx = 0;
      why = lang === "en" ? "Rough sea: not recommended for diving or snorkelling." : "Mar agitada: no recomendado para bucear o hacer snorkel.";
    }
    sports.push({ key: "dive", name: st("sport.dive"), icon: "mask", idx, why });
  }

  return sports.map((s) => ({
    ...s,
    rating: s.idx === null ? null : RATING_ORDER[clampRatingIndex(s.idx)],
    ratingLabel: s.idx === null ? t("rating.sinDatos") : ratingLabel(RATING_ORDER[clampRatingIndex(s.idx)]),
  }));
}
