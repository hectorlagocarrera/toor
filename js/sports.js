// Reglas de aptitud orientativas (no oficiales) para deportes acuáticos en Las Canteras.
const RATING_ORDER = ["malo", "regular", "bueno", "excelente"];
const RATING_LABEL = { malo: "Malo", regular: "Regular", bueno: "Bueno", excelente: "Excelente" };

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
  if (kw === null) return { label: "Sin datos", cls: "regular" };
  if (kw < 3) return { label: "Plana / muy pequeña", cls: "malo" };
  if (kw < 8) return { label: "Suave", cls: "regular" };
  if (kw < 15) return { label: "Con fuerza", cls: "bueno" };
  if (kw < 25) return { label: "Potente", cls: "excelente" };
  return { label: "Muy potente (peligrosa)", cls: "malo" };
}

function swellPeriodType(periodS) {
  if (periodS === null || periodS === undefined) return "Sin datos";
  if (periodS < 8) return "Swell de viento (corto, más desordenado)";
  if (periodS <= 12) return "Periodo medio";
  return "Mar de fondo (groundswell, olas más limpias y potentes)";
}

function swellDirectionMatch(dirDeg) {
  if (dirDeg === null || dirDeg === undefined) return "Sin datos de dirección.";
  // La Barra / El Confital reciben mejor los swells de componente N a NE.
  const goodMatch = dirDeg >= 300 || dirDeg <= 60;
  return goodMatch
    ? "Buena orientación para romper en La Barra / El Confital."
    : "Orientación menos habitual para las rompientes de Las Canteras.";
}

function windTypeLabel(dirDeg) {
  if (dirDeg === null || dirDeg === undefined) return "Sin datos";
  if (isOffshoreWind(dirDeg)) return "Terral (offshore) — limpia la ola";
  if (isOnshoreWind(dirDeg)) return "De cara (onshore) — desordena la ola";
  return "Cruzado (cross-shore)";
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
    periodType: swellPeriodType(swellPer),
    power,
    powerLabel: powerInfo.label,
    powerClass: powerInfo.cls,
    directionMatch: swellDirectionMatch(swellDir),
    windType: windTypeLabel(d.windDir),
    windSpeed: d.windSpeed ?? null,
    windGust: d.windGust ?? null,
    windDir: d.windDir ?? null,
  };
}

function computeSportRatings(d) {
  const wind = d.windSpeed ?? 0;
  const gust = d.windGust ?? wind;
  const windDir = d.windDir;
  const waveH = d.waveHeight ?? null;
  const wavePer = d.wavePeriod ?? null;
  const swellH = d.swellHeight ?? waveH;
  const swellPer = d.swellPeriod ?? wavePer;
  const hasMarine = waveH !== null && waveH !== undefined;

  const sports = [];

  // --- SURF / BODYBOARD ---
  {
    const h = swellH ?? waveH;
    const per = swellPer ?? wavePer;
    let idx;
    let why;
    if (!hasMarine || h === null) {
      idx = null;
      why = "Sin datos de oleaje disponibles ahora mismo.";
    } else if (h < 0.3) {
      idx = 0;
      why = `Mar casi plana (${h.toFixed(1)} m). No hay olas para surfear.`;
    } else if (h < 0.6) {
      idx = 1;
      why = `Oleaje pequeño (${h.toFixed(1)} m), aceptable solo para iniciación en La Barra.`;
    } else if (h <= 2.2) {
      idx = per && per >= 8 ? 3 : 2;
      why = `Oleaje de ${h.toFixed(1)} m con periodo ${per ? per.toFixed(0) : "?"} s en La Barra / El Confital.`;
    } else if (h <= 3) {
      idx = 1;
      why = `Mar de fondo grande (${h.toFixed(1)} m): solo nivel avanzado.`;
    } else {
      idx = 0;
      why = `Oleaje muy grande (${h.toFixed(1)} m): condición de riesgo, no recomendado.`;
    }
    if (idx !== null && isOnshoreWind(windDir) && wind > 20) {
      idx = clampRatingIndex(idx - 1);
      why += " Viento de cara que puede desordenar la ola.";
    } else if (idx !== null && isOffshoreWind(windDir) && wind < 25) {
      why += " Viento de tierra, ayuda a limpiar la ola.";
    }
    sports.push({ key: "surf", name: "Surf", emoji: "🏄", idx, why });
  }

  {
    const h = waveH;
    let idx, why;
    if (!hasMarine || h === null) {
      idx = null;
      why = "Sin datos de oleaje disponibles ahora mismo.";
    } else if (h < 0.3) {
      idx = 1;
      why = `Olas muy pequeñas (${h.toFixed(1)} m) para bodyboard.`;
    } else if (h <= 1.6) {
      idx = 3;
      why = `Buen tamaño de ola (${h.toFixed(1)} m) para bodyboard en la orilla norte.`;
    } else if (h <= 2.5) {
      idx = 2;
      why = `Olas grandes (${h.toFixed(1)} m), recomendable con experiencia.`;
    } else {
      idx = 0;
      why = `Oleaje excesivo (${h.toFixed(1)} m) para bodyboard seguro.`;
    }
    sports.push({ key: "bodyboard", name: "Bodyboard", emoji: "🏊", idx, why });
  }

  // --- PADDLE SURF (SUP) ---
  {
    let idx, why;
    const h = waveH ?? 0;
    if (wind < 12 && h < 0.5) {
      idx = 3;
      why = `Mar en calma y viento suave (${wind.toFixed(0)} km/h): ideal para SUP.`;
    } else if (wind < 20 && h < 1) {
      idx = 2;
      why = `Condiciones moderadas (viento ${wind.toFixed(0)} km/h), navegable con cuidado.`;
    } else if (wind < 28) {
      idx = 1;
      why = `Viento notable (${wind.toFixed(0)} km/h), complicado para remar en línea recta.`;
    } else {
      idx = 0;
      why = `Viento fuerte (${wind.toFixed(0)} km/h): riesgo de deriva, no recomendado.`;
    }
    sports.push({ key: "sup", name: "Paddle surf (SUP)", emoji: "🛶", idx, why });
  }

  // --- NATACIÓN / BAÑO ---
  {
    const h = waveH ?? 0;
    let idx, why;
    if (!hasMarine) {
      idx = wind < 20 ? 2 : 1;
      why = "Sin datos de oleaje; valorado solo con el viento.";
    } else if (h < 0.5) {
      idx = 3;
      why = `Mar tranquila (${h.toFixed(1)} m), buena para nadar en la zona central protegida.`;
    } else if (h < 1) {
      idx = 2;
      why = `Algo de oleaje (${h.toFixed(1)} m), báñate con precaución.`;
    } else if (h < 1.5) {
      idx = 1;
      why = `Oleaje moderado (${h.toFixed(1)} m), cuidado con las corrientes.`;
    } else {
      idx = 0;
      why = `Oleaje considerable (${h.toFixed(1)} m): no recomendado para el baño tranquilo.`;
    }
    sports.push({ key: "natacion", name: "Natación / baño", emoji: "🏊‍♀️", idx, why });
  }

  // --- BUCEO / SNORKEL ---
  {
    const h = waveH ?? 0;
    let idx, why;
    if (wind < 15 && h < 0.6) {
      idx = 3;
      why = "Mar en calma, buena visibilidad esperable en Peña La Vieja.";
    } else if (wind < 22 && h < 1) {
      idx = 2;
      why = "Condiciones aceptables, algo de movimiento en superficie.";
    } else if (wind < 30) {
      idx = 1;
      why = "Bastante movimiento, la visibilidad puede empeorar por el oleaje.";
    } else {
      idx = 0;
      why = "Mar agitada: no recomendado para bucear o hacer snorkel.";
    }
    sports.push({ key: "buceo", name: "Buceo / snorkel", emoji: "🤿", idx, why });
  }

  return sports.map((s) => ({
    ...s,
    rating: s.idx === null ? null : RATING_ORDER[clampRatingIndex(s.idx)],
    ratingLabel: s.idx === null ? "Sin datos" : RATING_LABEL[RATING_ORDER[clampRatingIndex(s.idx)]],
  }));
}
