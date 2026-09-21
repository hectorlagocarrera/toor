# MeteoCanteras

Web app (funciona en escritorio y móvil) con información meteorológica y del estado del mar
de la **Playa de Las Canteras** (Las Palmas de Gran Canaria), pensada para quienes practican
deportes acuáticos: surf, bodyboard, windsurf, kitesurf, paddle surf (SUP), natación en aguas
abiertas, buceo/snorkel y vela ligera. Incluye también una sección con cámaras web públicas en
directo de la playa.

## Contenido

- **Ahora**: temperatura del aire y sensación térmica, viento (velocidad, rachas, dirección),
  oleaje y mar de fondo (altura, periodo, dirección), temperatura del agua, índice UV, humedad,
  visibilidad y lluvia.
- **Previsión**: próximas 24 horas y próximos 7 días.
- **Deportes**: incluye un **informe de surf detallado** (altura y periodo del mar de fondo,
  tipo de swell, potencia estimada de la ola en kW/m, orientación respecto a La Barra/El
  Confital, tipo de viento —terral/de cara/cruzado— y enlace a la tabla oficial de mareas) y una
  valoración orientativa (Excelente / Bueno / Regular / Malo) por deporte, calculada a partir del
  viento y el oleaje actuales.
- **Cámaras**: vídeo en directo insertado en la propia página (vía el reproductor público de
  Windy.com) más enlaces a otras cámaras web que no permiten insertarse en otras páginas.
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
pensado para poder integrarse en otras webs. El resto de cámaras (SkylineWebcams, WebcamTaxi,
WhatsUpCams, Oceanside Gran Canaria, Spain-GranCanaria.com) son enlaces a sus webs, ya que esos
proveedores bloquean que su vídeo se muestre dentro de otra página.

La potencia de ola del informe de surf es una estimación orientativa con la fórmula habitual de
previsión de surf P ≈ 0.5 · Hs² · Tp (kW/m), y la marea enlaza a la predicción oficial del
Instituto Hidrográfico de la Marina para el Puerto de la Luz, ya que calcular mareas requiere
constituyentes armónicos oficiales que no ofrece una API pública gratuita.

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
- Zonas de la playa: `js/config.js` (`ZONES`).

## Aviso

Esta aplicación tiene fines informativos y no sustituye la señalización oficial de las banderas
de baño ni las indicaciones de los servicios de socorrismo/Cruz Roja en la playa.
