# MeteoCanteras

Web app (funciona en escritorio y móvil) con información meteorológica y del estado del mar
de la **Playa de Las Canteras** (Las Palmas de Gran Canaria), pensada para quienes practican
deportes acuáticos: surf, bodyboard, paddle surf (SUP), natación en aguas abiertas y
buceo/snorkel. Incluye también una tabla de mareas y una sección con cámaras web en directo
de la playa.

## Contenido

- **Ahora**: temperatura del aire y sensación térmica, viento (velocidad, rachas, dirección),
  oleaje y mar de fondo (altura, periodo, dirección), temperatura del agua, índice UV, humedad,
  visibilidad y lluvia.
- **Previsión**: próximas 24 horas y próximos 7 días.
- **Deportes**: incluye un **informe de surf detallado** (altura y periodo del mar de fondo,
  tipo de swell, potencia estimada de la ola en kW/m, orientación respecto a La Barra/El
  Confital y tipo de viento —terral/de cara/cruzado—), una **tabla de mareas** en directo, y una
  valoración orientativa (Excelente / Bueno / Regular / Malo) por deporte —surf, bodyboard,
  paddle surf, natación y buceo/snorkel; no se incluyen windsurf, kitesurf ni vela porque no se
  practican en esta playa— calculada a partir del viento y el oleaje actuales.
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
- `https://marine-api.open-meteo.com/v1/marine` — oleaje y temperatura del agua.

Las cámaras en directo se insertan mediante el reproductor público de embebido de
[Windy.com](https://www.windy.com/webcams) (`webcams.windy.com/webcams/public/embed/player/...`),
pensado para poder integrarse en otras webs; al ser cámaras subidas por usuarios de Windy, alguna
puede dejar de emitir en cualquier momento, por eso cada una lleva debajo un botón de respaldo
directo a la misma cámara en windy.com. El resto de proveedores (SkylineWebcams, WebcamTaxi,
WhatsUpCams, Oceanside Gran Canaria, Spain-GranCanaria.com, Surf-Forecast, ExploreWebcams,
LiveBeaches, miplayadelascanteras.com, CanariasLife) no permiten insertar su vídeo en otra
página, así que se muestran como enlace directo a su web.

La potencia de ola del informe de surf es una estimación orientativa con la fórmula habitual de
previsión de surf P ≈ 0.5 · Hs² · Tp (kW/m). La tabla de mareas se inserta desde
[marea.ooo](https://marea.ooo), la instancia pública del proyecto open-source
[Mareia](https://github.com/JavierCervilla/mareia): un motor de predicción armónica propio
(método de Foreman, 1977) sobre constantes TICON-4 con licencia CC-BY, validado específicamente
para la estación de Las Palmas de Gran Canaria / Puerto de la Luz. No calculamos la marea
nosotros mismos porque requiere astronomía de precisión (argumentos astronómicos y correcciones
nodales) que no tiene sentido reimplementar de forma casera; por eso también se enlaza la
predicción oficial del Instituto Hidrográfico de la Marina como fuente alternativa.

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
- Umbrales de aptitud por deporte e informe de surf: `js/sports.js`.
- Lista de cámaras: `js/config.js` (`EMBED_WEBCAMS` para las insertadas, `WEBCAMS` para las de solo enlace).
- Tabla de mareas: `js/config.js` (`MAREA_URL`, `TIDE_INFO_URL`).
- Zonas de la playa: `js/config.js` (`ZONES`).

## Aviso

Esta aplicación tiene fines informativos y no sustituye la señalización oficial de las banderas
de baño ni las indicaciones de los servicios de socorrismo/Cruz Roja en la playa.
