// Descarga avisos oficiales y previsión municipal de AEMET OpenData y los vuelca en
// data/aemet.json. Se ejecuta solo en el GitHub Action (.github/workflows/aemet.yml),
// nunca en el navegador: así la API key vive únicamente como secret de GitHub y el sitio
// estático solo lee un JSON same-origin (sin problema de CORS con opendata.aemet.es).
import { XMLParser } from "fast-xml-parser";
import { gunzipSync } from "node:zlib";
import { writeFile, mkdir } from "node:fs/promises";

const API_KEY = process.env.AEMET_API_KEY;

const BASE = "https://opendata.aemet.es/opendata";
// avisos_cap solo admite de forma fiable "esp" (todo el país, ~190 boletines CAP); no hay
// códigos de área por comunidad/provincia documentados que funcionen ("can" da 404). Se
// descarga todo y se filtra por zona con AREA_MATCH más abajo.
const AVISOS_AREA = "esp";
const MUNICIPIO = "35016"; // Las Palmas de Gran Canaria (código INE)
// Zonas de aviso que nos interesan (Gran Canaria, donde está Las Canteras).
const AREA_MATCH = /gran canaria|las palmas/i;

async function aemetGet(path) {
  const url = `${BASE}${path}${path.includes("?") ? "&" : "?"}api_key=${encodeURIComponent(API_KEY)}`;
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!res.ok) {
    throw new Error(`AEMET ${path} -> HTTP ${res.status}: ${buf.toString("utf-8").slice(0, 300)}`);
  }
  return buf;
}

// La mayoría de endpoints de AEMET devuelven un JSON con {estado, datos: "<url temporal>"}.
// Hay que seguir esa segunda URL para obtener el contenido real (JSON o binario).
async function aemetGetFollowingEnvelope(path) {
  const first = await aemetGet(path);
  let envelope;
  try {
    envelope = JSON.parse(first.toString("utf-8"));
  } catch {
    // Algunas respuestas (poco frecuente) ya son el contenido final, no un envoltorio JSON.
    return first;
  }
  if (envelope.estado && envelope.estado !== 200) {
    throw new Error(`AEMET ${path} -> estado ${envelope.estado}: ${envelope.descripcion || ""}`);
  }
  if (!envelope.datos) {
    throw new Error(`AEMET ${path} -> respuesta sin campo "datos": ${first.toString("utf-8").slice(0, 300)}`);
  }
  const res = await fetch(envelope.datos);
  if (!res.ok) {
    throw new Error(`AEMET datos (${envelope.datos}) -> HTTP ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// Extractor mínimo de tar (formato POSIX ustar) sin dependencias: los avisos_cap llegan
// como un .tar.gz con un XML CAP por cada boletín activo.
function extractTar(buf) {
  const files = [];
  let offset = 0;
  while (offset + 512 <= buf.length) {
    const header = buf.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break; // bloque final de ceros
    const name = header.subarray(0, 100).toString("utf-8").replace(/\0.*$/, "").trim();
    const sizeOctal = header.subarray(124, 136).toString("utf-8").replace(/\0.*$/, "").trim();
    const size = parseInt(sizeOctal, 8) || 0;
    offset += 512;
    if (name && size > 0) {
      files.push({ name, content: buf.subarray(offset, offset + size) });
    }
    offset += Math.ceil(size / 512) * 512;
  }
  return files;
}

function decodeMaybeGzipTar(buf) {
  let bytes = buf;
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    bytes = gunzipSync(bytes);
  }
  // ustar magic en el offset 257 de cada bloque de cabecera
  if (bytes.subarray(257, 262).toString("utf-8") === "ustar") {
    return extractTar(bytes).map((f) => ({ name: f.name, xml: f.content.toString("utf-8") }));
  }
  const asText = bytes.toString("utf-8");
  if (asText.trim().startsWith("<?xml") || asText.includes("<alert")) {
    return [{ name: "single.xml", xml: asText }];
  }
  throw new Error("Formato de avisos_cap no reconocido (ni tar.gz ni XML directo)");
}

const LEVEL_BY_SEVERITY = { Minor: "amarillo", Moderate: "amarillo", Severe: "naranja", Extreme: "rojo" };

function normalizeInfos(alertXmlFiles) {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const out = [];
  for (const { name, xml } of alertXmlFiles) {
    let doc;
    try {
      doc = parser.parse(xml);
    } catch (err) {
      console.warn(`No se pudo parsear ${name}: ${err.message}`);
      continue;
    }
    const alert = doc.alert;
    if (!alert) continue;
    const infos = Array.isArray(alert.info) ? alert.info : alert.info ? [alert.info] : [];
    for (const info of infos) {
      if (info.language && !String(info.language).toLowerCase().startsWith("es")) continue;
      const areas = Array.isArray(info.area) ? info.area : info.area ? [info.area] : [];
      const matchingAreas = areas.filter((a) => AREA_MATCH.test(String(a.areaDesc || "")));
      if (matchingAreas.length === 0) continue;

      const params = Array.isArray(info.parameter) ? info.parameter : info.parameter ? [info.parameter] : [];
      const nivelParam = params.find((p) => /nivel/i.test(String(p.valueName || "")));
      const level = nivelParam?.value?.toLowerCase?.() || LEVEL_BY_SEVERITY[info.severity] || "amarillo";
      if (level === "verde") continue; // sin aviso activo real

      out.push({
        event: info.event || info.headline || "Aviso meteorológico",
        headline: info.headline || "",
        description: (info.description || "").replace(/\s+/g, " ").trim(),
        level,
        severity: info.severity || null,
        effective: info.effective || info.onset || null,
        expires: info.expires || null,
        areaDesc: matchingAreas.map((a) => a.areaDesc).join(", "),
      });
    }
  }
  // Deduplicar avisos idénticos repetidos en distintos ficheros/zonas.
  const seen = new Set();
  return out.filter((a) => {
    const key = `${a.event}|${a.level}|${a.effective}|${a.expires}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchAvisos() {
  const raw = await aemetGetFollowingEnvelope(`/api/avisos_cap/ultimoelaborado/area/${AVISOS_AREA}`);
  const files = decodeMaybeGzipTar(raw);
  return normalizeInfos(files);
}

async function fetchForecast() {
  const raw = await aemetGetFollowingEnvelope(`/api/prediccion/especifica/municipio/diaria/${MUNICIPIO}`);
  // La previsión diaria viene codificada en ISO-8859-1, no UTF-8.
  const text = new TextDecoder("iso-8859-1").decode(raw);
  const json = JSON.parse(text);
  const muni = Array.isArray(json) ? json[0] : json;
  const dias = muni?.prediccion?.dia || [];
  // El resumen del día completo viene con periodo "00-24"; si no existe (formato distinto),
  // recurrimos al primer elemento disponible en vez de dejar el dato vacío.
  const findDaily = (list) => {
    const arr = Array.isArray(list) ? list : list ? [list] : [];
    return arr.find((x) => x?.periodo === "00-24") || arr[0] || null;
  };
  return dias.slice(0, 5).map((dia) => {
    const cieloDiario = findDaily(dia.estadoCielo);
    const precipDiario = findDaily(dia.probPrecipitacion);
    return {
      fecha: dia.fecha,
      tMax: dia.temperatura?.maxima ?? null,
      tMin: dia.temperatura?.minima ?? null,
      cielo: cieloDiario?.descripcion || null,
      probPrecip: precipDiario?.value ?? null,
    };
  });
}

async function main() {
  if (!API_KEY) {
    console.error("Falta la variable de entorno AEMET_API_KEY");
    process.exit(1);
  }
  const result = { updated: new Date().toISOString(), avisos: [], forecast: [], errors: [] };

  try {
    result.avisos = await fetchAvisos();
  } catch (err) {
    console.error("Error obteniendo avisos:", err.message);
    result.errors.push(`avisos: ${err.message}`);
  }

  try {
    result.forecast = await fetchForecast();
  } catch (err) {
    console.error("Error obteniendo previsión:", err.message);
    result.errors.push(`forecast: ${err.message}`);
  }

  await mkdir("data", { recursive: true });
  await writeFile("data/aemet.json", JSON.stringify(result, null, 2) + "\n", "utf-8");
  console.log(`OK — ${result.avisos.length} aviso(s), ${result.forecast.length} día(s) de previsión.`);

  if (result.errors.length > 0 && result.avisos.length === 0 && result.forecast.length === 0) {
    process.exit(1); // fallo total: que el Action quede en rojo y se note en los logs
  }
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((err) => {
    console.error("Fallo inesperado:", err);
    process.exit(1);
  });
}

export { extractTar, decodeMaybeGzipTar, normalizeInfos, fetchAvisos, fetchForecast };
