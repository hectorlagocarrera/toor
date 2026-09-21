// Set de iconos propio (trazo, 24x24), para no depender de emojis ni de librerías externas.
const ICON_PATHS = {
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h8a2.5 2.5 0 1 1-2.5 2.5"/>',
  waves:
    '<path d="M2 9c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0"/><path d="M2 15c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0"/>',
  tide: '<circle cx="12" cy="12" r="9"/><path d="M7 13c1-1.5 2.5-1.5 3.5 0s2.5 1.5 3.5 0 2.5-1.5 3.5 0" /><path d="M12 6.5v2M12 15.5v2"/>',
  thermometer:
    '<path d="M12 14.5V5a2 2 0 1 0-4 0v9.5a4 4 0 1 0 4 0Z"/><circle cx="10" cy="17" r="1" fill="currentColor" stroke="none"/>',
  droplet: '<path d="M12 3c3.5 4.5 6 8 6 11a6 6 0 1 1-12 0c0-3 2.5-6.5 6-11Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"/>',
  humidity: '<path d="M12 3c3.5 4.5 6 8 6 11a6 6 0 1 1-12 0c0-3 2.5-6.5 6-11Z"/><path d="M9.2 15a2.8 2.8 0 0 0 2.8 2.8"/>',
  rain: '<path d="M7 15a4.5 4.5 0 0 1 .5-9 5.5 5.5 0 0 1 10.6 1.8A4 4 0 0 1 17.5 15Z"/><path d="M8 18.5 7 21M12.5 18.5l-1 2.5M17 18.5l-1 2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  camera:
    '<rect x="2.5" y="7" width="13" height="10" rx="2"/><path d="M15.5 10.5 21 8v8l-5.5-2.5Z"/>',
  pin: '<path d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3"/>',
  lifebuoy:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m6.3 6.3 2.6 2.6M15.1 15.1l2.6 2.6M17.7 6.3l-2.6 2.6M8.9 15.1l-2.6 2.6"/>',
  surfboard: '<path d="M12 2c3 4 4.5 10 3 16-1 3.5-5 3.5-6 0-1.5-6 0-12 3-16Z"/><path d="M12 5v14"/>',
  paddle: '<path d="M12 2c-1.4 0-2.5 1.1-2.5 2.5S10.6 7 12 7s2.5-1.1 2.5-2.5S13.4 2 12 2Z"/><path d="M12 7v13m-2.5-2h5"/>',
  swimmer:
    '<circle cx="17.5" cy="5.5" r="1.6"/><path d="M4 12.5 8 10l3 1.8 3-1.8 3 1.8"/><path d="M2 17c1.5-1.6 3.5-1.6 5 0s3.5 1.6 5 0 3.5-1.6 5 0 2.5 1.4 5 1"/>',
  mask: '<rect x="3" y="8" width="18" height="9" rx="4.5"/><circle cx="8.5" cy="12.5" r="2"/><circle cx="15.5" cy="12.5" r="2"/><path d="M10.5 12.5h3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18"/>',
  refresh: '<path d="M4 4v5h5"/><path d="M20 20v-5h-5"/><path d="M5 15a8 8 0 0 0 13.7 3.8M19 9A8 8 0 0 0 5.3 5.2"/>',
  shield: '<path d="M12 2.5 5 5.5v5.5c0 5 3 8.5 7 10.5 4-2 7-5.5 7-10.5V5.5Z"/><path d="m9 12 2 2 4-4.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
  share: '<circle cx="18" cy="5" r="2.3"/><circle cx="6" cy="12" r="2.3"/><circle cx="18" cy="19" r="2.3"/><path d="m8.1 10.8 7.8-4.6M8.1 13.2l7.8 4.6"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h13l-3 4 3 4H5"/>',
  wetsuit: '<path d="M9 3h6l1.5 4-2 2v12h-3V9l-2-2Z"/><path d="M9 3 6 9l2 2M15 3l3 6-2 2"/>',
};

function icon(name, cls = "") {
  const path = ICON_PATHS[name];
  if (!path) return "";
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}
