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
- **Previsión**: una **tabla compacta al estilo Windguru** (viento, rachas y dirección, oleaje,
  periodo y dirección, y temperatura del aire **y del agua** cada 3 horas, con celdas coloreadas
  por intensidad), además de las próximas 24 horas en tarjetas y los próximos 7 días.
- **Deportes**: incluye las **mejores franjas horarias para surfear**, calculadas por día (nunca
  cruzan la medianoche) y **solo con luz solar** (usa el amanecer/atardecer del día para no
  recomendar nunca surfear de noche, por bueno que esté el oleaje sobre el papel), con la hora
  "pico" de cada una justificada con datos concretos de oleaje y viento, más un **mini-gráfico
  hora a hora** de las próximas ~30h para ver la evolución dentro de cada franja; un **informe de surf detallado** (altura y periodo del mar de fondo, tipo de
  swell, potencia estimada de la ola en kW/m, orientación respecto a La Barra/El Confital y tipo
  de viento —terral/de cara/cruzado—); una **tabla de mareas** (altura actual, tendencia y
  próximos cambios); y una valoración orientativa (Excelente / Bueno / Regular / Malo) por
  deporte —surf, bodyboard, paddle surf, natación y buceo/snorkel; no se incluyen windsurf,
  kitesurf ni vela porque no se practican en esta playa— calculada a partir del viento y el
  oleaje actuales.
- **Cámaras**: vídeo en directo insertado en la propia página (vía el reproductor público de
  Windy.com) más una amplia lista de enlaces a otras cámaras web de distintos proveedores que no
  permiten insertar su vídeo en otras páginas.
- **Playa**: descripción de las zonas de la playa (La Cícer, Peña La Vieja, playa central, La
  Puntilla, La Barra/El Confital) y qué deporte se practica habitualmente en cada una.

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
previsión de surf P ≈ 0.5 · Hs² · Tp (kW/m). Las mejores franjas horarias para surfear se calculan
puntuando cada hora de las próximas ~30h con los mismos criterios que la tarjeta de Surf (altura y
periodo del oleaje, y si el viento es de cara) y agrupando las horas seguidas con buena puntuación.

La marea actual, su tendencia y la próxima pleamar/bajamar se calculan directamente a partir de
`sea_level_height_msl` (nivel del mar horario, que ya incluye la marea) de la propia API de
Open-Meteo: se busca dónde cambia de signo la pendiente de la serie horaria, sin astronomía
propia ni servicios externos. Ten en cuenta que ese modelo tiene ~8 km de resolución, así que es
orientativo; para navegación se enlaza también la predicción oficial del Instituto Hidrográfico
de la Marina, además del gráfico del proyecto open-source [Mareia](https://github.com/JavierCervilla/mareia)
en [marea.ooo](https://marea.ooo) (motor armónico validado específicamente para Las Palmas /
Puerto de la Luz).

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
- Bandas de color de la tabla Windguru: `windBand` / `waveBand` en `js/weather.js`.
- Umbrales de aptitud por deporte, informe de surf, franjas horarias y marea: `js/sports.js`.
- Lista de cámaras: `js/config.js` (`EMBED_WEBCAMS` para las insertadas, `WEBCAMS` para las de solo enlace).
- Enlaces de marea: `js/config.js` (`MAREA_URL`, `TIDE_INFO_URL`).
- Zonas de la playa: `js/config.js` (`ZONES`).

## Aviso

Esta aplicación tiene fines informativos y no sustituye la señalización oficial de las banderas
de baño ni las indicaciones de los servicios de socorrismo/Cruz Roja en la playa.
