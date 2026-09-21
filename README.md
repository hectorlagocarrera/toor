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
- **Deportes**: valoración orientativa (Excelente / Bueno / Regular / Malo) por deporte, calculada
  a partir del viento y el oleaje actuales.
- **Cámaras**: enlaces a cámaras web públicas en directo de distintos proveedores.
- **Playa**: descripción de las zonas de la playa (La Cícer, Peña La Vieja, playa central, La
  Puntilla, La Barra/El Confital) y qué deporte se practica habitualmente en cada una.

## Cómo funciona

Es una aplicación **100% estática** (HTML + CSS + JavaScript, sin build ni backend). Los datos
meteorológicos y de oleaje se piden directamente desde el navegador del usuario a la API pública
y gratuita de [Open-Meteo](https://open-meteo.com) (sin necesidad de API key):

- `https://api.open-meteo.com/v1/forecast` — meteorología.
- `https://marine-api.open-meteo.com/v1/marine` — oleaje y temperatura del agua.

Las cámaras web son enlaces a proveedores externos (SkylineWebcams, WebcamTaxi, WhatsUpCams,
Oceanside Gran Canaria, Spain-GranCanaria.com); no se reemiten ni se procesan desde esta app.

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
- Umbrales de aptitud por deporte: `js/sports.js`.
- Lista de cámaras: `js/config.js` (`WEBCAMS`).
- Zonas de la playa: `js/config.js` (`ZONES`).

## Aviso

Esta aplicación tiene fines informativos y no sustituye la señalización oficial de las banderas
de baño ni las indicaciones de los servicios de socorrismo/Cruz Roja en la playa.
