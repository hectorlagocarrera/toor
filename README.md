# MeteoCanteras

Web app (funciona en escritorio y móvil) con información meteorológica y del estado del mar
de la **Playa de Las Canteras** (Las Palmas de Gran Canaria), pensada para quienes practican
deportes acuáticos: surf, bodyboard, paddle surf (SUP), natación en aguas abiertas y
buceo/snorkel. Incluye también una tabla de mareas y una sección con cámaras web en directo
de la playa.

## Contenido

- **Ahora**: temperatura del aire y sensación térmica, viento (velocidad, rachas, dirección),
  oleaje y mar de fondo (altura, periodo, dirección), **marea actual y tendencia** (subiendo/
  bajando, con la próxima pleamar o bajamar), temperatura del agua, índice UV, humedad,
  visibilidad y lluvia.
- **Previsión**: una **tabla detallada** (viento, rachas y dirección, oleaje, periodo y
  dirección, y temperatura del aire **y del agua** cada 3 horas, con celdas coloreadas por
  intensidad), además de las próximas 24 horas en tarjetas y los próximos 7 días.
- **Deportes**: incluye las **mejores franjas horarias para surfear**, calculadas por día (nunca
  cruzan la medianoche) y **solo con luz solar** (usa el amanecer/atardecer del día para no
  recomendar nunca surfear de noche, por bueno que esté el oleaje sobre el papel), con la hora
  "pico" de cada una justificada con datos concretos de oleaje y viento, más un **mini-gráfico
  hora a hora** de las próximas ~30h para ver la evolución dentro de cada franja; un **informe de surf detallado** (altura y periodo del mar de fondo, tipo de
  swell, potencia estimada de la ola en kW/m, orientación respecto a La Barra/El Confital y tipo
  de viento —terral/de cara/cruzado—); una **tabla de mareas** (altura actual, tendencia y
  próximos cambios, y una **curva de marea en SVG** con sombreado de noche/día y marcador de
  "ahora"); un **aviso propio de riesgo de corriente** (orientativo, a partir de oleaje/marea/
  viento, inspirado en los factores del modelo de la NOAA pero muy simplificado); y una
  valoración orientativa (Excelente / Bueno / Regular / Malo) por deporte —surf, bodyboard,
  paddle surf, natación y buceo/snorkel; no se incluyen windsurf, kitesurf ni vela porque no se
  practican en esta playa— calculada a partir del viento y el oleaje actuales.
- **Cámaras**: vídeo en directo insertado en la propia página (vía el reproductor público de
  Windy.com) más una amplia lista de enlaces a otras cámaras web de distintos proveedores que no
  permiten insertar su vídeo en otras páginas.
- **Playa**: descripción de las zonas de la playa (La Cícer, Peña La Vieja, playa central, La
  Puntilla, La Barra/El Confital) y qué deporte se practica habitualmente en cada una.
- **Recomendación de neopreno** en la tarjeta de Agua (Ahora), según la temperatura del mar.
- **Modo oscuro manual** (botón en la cabecera, además del automático según el sistema) y
  **botón de compartir** el estado actual (Web Share API, con copia al portapapeles como reserva).

## Idioma e iconos

La interfaz está disponible en **español e inglés** (selector ES/EN en la cabecera). El idioma
se detecta automáticamente del navegador la primera vez y luego se recuerda (`localStorage`);
cambiarlo actualiza al momento todos los textos, incluidos los generados dinámicamente (la
explicación de cada franja de surf, las descripciones de aptitud por deporte, los códigos
meteorológicos, etc.), sin recargar la página. Los textos viven en `js/i18n.js`; añadir un
idioma nuevo consiste en añadir una clave más a `SUPPORTED_LANGS` y su objeto de traducciones
en `I18N`.

Los iconos son un set propio en trazo (`js/icons.js`, SVG inline, sin depender de ninguna
librería externa ni de emojis) para mantener un aspecto más cuidado y consistente en toda la app.

La pestaña "Ahora" abre con una cabecera tipo *hero* (temperatura, condición e iconos de viento,
oleaje, agua y marea a gran tamaño) y el resto de la interfaz usa insignias de color para cada
icono, botones y estados con degradados suaves, y sombras/hover más marcados en las tarjetas,
para dar una sensación más cuidada sin perder la sobriedad general del diseño.

## Cómo funciona

Es una aplicación **100% estática** (HTML + CSS + JavaScript, sin build ni backend). Los datos
meteorológicos y de oleaje se piden directamente desde el navegador del usuario a la API pública
y gratuita de [Open-Meteo](https://open-meteo.com) (sin necesidad de API key):

- `https://api.open-meteo.com/v1/forecast` — meteorología.
- `https://marine-api.open-meteo.com/v1/marine` — oleaje, temperatura del agua y nivel del mar
  (`sea_level_height_msl`, que ya incluye la marea), con `cell_selection=sea` para forzar que la
  API use una celda de mar en vez de una de tierra (Las Canteras está muy pegada a la costa, y
  sin esto algunas variables marinas pueden devolver `null` en este punto exacto).

La cámara de La Cícer se inserta mediante el reproductor público de embebido de
[Windy.com](https://www.windy.com/webcams) (`webcams.windy.com/webcams/public/embed/player/...`),
pensado para poder integrarse en otras webs, con un botón de respaldo directo a la misma cámara
en windy.com por si deja de emitir. Se probaron otras tres cámaras de usuarios de Windy pero no
emitían vídeo de forma fiable, así que se han dejado como enlace en vez de insertarlas. El resto
de proveedores (SkylineWebcams, WebcamTaxi, WhatsUpCams, Oceanside Gran Canaria,
Spain-GranCanaria.com, Surf-Forecast, ExploreWebcams, LiveBeaches, miplayadelascanteras.com,
CanariasLife) no permiten insertar su vídeo en otra página, así que se muestran como enlace
directo a su web.

La potencia de ola del informe de surf es una estimación orientativa con la fórmula habitual de
previsión de surf P ≈ 0.5 · Hs² · Tp (kW/m), calculada sobre el **mar de fondo** (`swell_wave_height`
/ `swell_wave_period`), no sobre el oleaje total. Las mejores franjas horarias para surfear usan
ese mismo dato hora a hora (con el oleaje total como reserva si no hay swell disponible), para que
nunca puedan salir descoordinados: si la potencia estimada es "plana", esa hora no puede aparecer
como una franja recomendada. El oleaje total (`wave_height`, que sí incluye el chop de viento) es
lo que se usa para Bodyboard y para la tabla de previsión, ya que ahí sí importa el tamaño de ola
en general y no solo el mar de fondo organizado.

La marea actual, su tendencia y la próxima pleamar/bajamar se calculan directamente a partir de
`sea_level_height_msl` (nivel del mar horario, que ya incluye la marea) de la propia API de
Open-Meteo: se busca dónde cambia de signo la pendiente de la serie horaria, sin astronomía
propia ni servicios externos. Ten en cuenta que ese modelo tiene ~8 km de resolución, así que es
orientativo; para navegación se enlaza también la predicción oficial del Instituto Hidrográfico
de la Marina, además del gráfico del proyecto open-source [Mareia](https://github.com/JavierCervilla/mareia)
en [marea.ooo](https://marea.ooo) (motor armónico validado específicamente para Las Palmas /
Puerto de la Luz).

El riesgo de corriente es una estimación propia y deliberadamente simple (no el modelo
estadístico certificado que usa la NOAA en EE. UU.): suma puntos por oleaje moderado/grande,
nivel del mar por debajo de la media (aproximación a bajamar) y viento fuerte de cara, y lo
traduce a Bajo/Moderado/Alto. Se explica así en la propia app para no dar una falsa sensación de
precisión oficial.

No existe una fuente pública y gratuita fiable con la bandera de baño en directo de Las Canteras
(el sistema municipal "LPA Beach" es la fuente oficial, pero es una app/sensores propios sin API
pública documentada ni un enlace estable a un estado del día), así que la app no incluye esa
sección: se apoya en el aviso propio de riesgo de corriente y anima a respetar siempre la
señalización física de Cruz Roja/socorrismo en la playa.

## Ejecutar en local

No requiere instalación. Basta con servir la carpeta como sitio estático, por ejemplo:

```bash
python3 -m http.server 8080
# o
npx serve .
```

y abrir `http://localhost:8080` en el navegador (también desde el móvil, en la misma red, usando
la IP del ordenador).

## Desplegar

Al no tener backend, se puede publicar en cualquier hosting estático: GitHub Pages, Netlify,
Vercel, Cloudflare Pages, etc. Solo hay que subir el contenido de esta carpeta.

## Personalizar

- Coordenadas y parámetros de las APIs: `js/config.js` (`BEACH_LOCATION`, `FORECAST_PARAMS`,
  `MARINE_PARAMS`).
- Bandas de color de la tabla de previsión: `windBand` / `waveBand` en `js/weather.js`.
- Umbrales de aptitud por deporte, informe de surf, franjas horarias, marea, neopreno y riesgo
  de corriente: `js/sports.js`.
- Lista de cámaras: `js/config.js` (`EMBED_WEBCAMS` para las insertadas, `WEBCAMS` para las de solo enlace).
- Enlaces de marea: `js/config.js` (`MAREA_URL`, `TIDE_INFO_URL`).
- Zonas de la playa: `js/config.js` (`ZONES`).
- Textos e idiomas: `js/i18n.js` (`I18N`). Iconos: `js/icons.js` (`ICON_PATHS`).

## Aviso

Esta aplicación tiene fines informativos y no sustituye la señalización oficial de las banderas
de baño ni las indicaciones de los servicios de socorrismo/Cruz Roja en la playa.
