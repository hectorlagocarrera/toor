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

  // --- WINDSURF ---
  {
    let idx, why;
    if (wind < 12) {
      idx = 0;
      why = `Viento flojo (${wind.toFixed(0)} km/h), insuficiente para planear.`;
    } else if (wind < 18) {
      idx = 1;
      why = `Viento ligero (${wind.toFixed(0)} km/h), aceptable con vela grande.`;
    } else if (wind <= 40) {
      idx = 3;
      why = `Viento de ${wind.toFixed(0)} km/h${isOnshoreWind(windDir) ? " de componente NE (alisio típico de La Cícer)" : ""}: condiciones muy buenas.`;
    } else if (wind <= 50) {
      idx = 2;
      why = `Viento fuerte (${wind.toFixed(0)} km/h), solo nivel avanzado.`;
    } else {
      idx = 0;
      why = `Viento muy fuerte (${wind.toFixed(0)} km/h, rachas ${gust.toFixed(0)}): riesgo alto.`;
    }
    sports.push({ key: "windsurf", name: "Windsurf", emoji: "🏄‍♂️", idx, why });
  }

  // --- KITESURF ---
  {
    let idx, why;
    if (wind < 14) {
      idx = 0;
      why = `Viento flojo (${wind.toFixed(0)} km/h), insuficiente para kite.`;
    } else if (wind < 18) {
      idx = 1;
      why = `Viento justo (${wind.toFixed(0)} km/h) con cometa grande.`;
    } else if (wind <= 38) {
      idx = 3;
      why = `Viento de ${wind.toFixed(0)} km/h, ideal para kitesurf en La Cícer.`;
    } else if (wind <= 48) {
      idx = 2;
      why = `Viento fuerte (${wind.toFixed(0)} km/h), cometa pequeña y nivel avanzado.`;
    } else {
      idx = 0;
      why = `Viento excesivo (rachas ${gust.toFixed(0)} km/h): no recomendado.`;
    }
    sports.push({ key: "kitesurf", name: "Kitesurf", emoji: "🪁", idx, why });
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

  // --- VELA LIGERA ---
  {
    let idx, why;
    if (wind < 8) {
      idx = 0;
      why = `Viento muy flojo (${wind.toFixed(0)} km/h) para navegar.`;
    } else if (wind < 12) {
      idx = 1;
      why = `Viento ligero (${wind.toFixed(0)} km/h).`;
    } else if (wind <= 28) {
      idx = 3;
      why = `Viento de ${wind.toFixed(0)} km/h, buenas condiciones de navegación.`;
    } else if (wind <= 38) {
      idx = 2;
      why = `Viento fresco (${wind.toFixed(0)} km/h), exige experiencia.`;
    } else {
      idx = 0;
      why = `Viento excesivo (${wind.toFixed(0)} km/h) para vela ligera.`;
    }
    sports.push({ key: "vela", name: "Vela ligera", emoji: "⛵", idx, why });
  }

  return sports.map((s) => ({
    ...s,
    rating: s.idx === null ? null : RATING_ORDER[clampRatingIndex(s.idx)],
    ratingLabel: s.idx === null ? "Sin datos" : RATING_LABEL[RATING_ORDER[clampRatingIndex(s.idx)]],
  }));
}
