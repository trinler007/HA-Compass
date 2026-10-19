/*
 * HA Compass Card – Kompass mit Fahrzeug, Sonnen- und Mondstand, Horizontverlauf.
 * Teil von HA-Compass (Apache-2.0). Sonnen-/Mondberechnung: SunCalc-Port
 * (BSD-2-Clause, © 2014 Vladimir Agafonkin) – siehe NOTICE.
 */
const CARD_VERSION = "0.2.1";

/* ------------------------------------------------------------ Astronomie (SunCalc) */
const RAD = Math.PI / 180, DAY_MS = 86400000, J1970 = 2440588, J2000 = 2451545, E = RAD * 23.4397;
const toDays = (t) => t / DAY_MS - 0.5 + J1970 - J2000;
const ra = (l, b) => Math.atan2(Math.sin(l) * Math.cos(E) - Math.tan(b) * Math.sin(E), Math.cos(l));
const dec = (l, b) => Math.asin(Math.sin(b) * Math.cos(E) + Math.cos(b) * Math.sin(E) * Math.sin(l));
const alt = (h, phi, d) => Math.asin(Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(h));
const sidereal = (d, lw) => RAD * (280.16 + 360.9856235 * d) - lw;
function sunElevation(t, lat, lon) {
  const d = toDays(t), M = RAD * (357.5291 + 0.98560028 * d);
  const L = M + RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + RAD * 102.9372 + Math.PI;
  const H = sidereal(d, RAD * -lon) - ra(L, 0);
  return alt(H, RAD * lat, dec(L, 0)) / RAD;
}
function moonElevation(t, lat, lon) {
  const d = toDays(t);
  const L = RAD * (218.316 + 13.176396 * d), M = RAD * (134.963 + 13.064993 * d), F = RAD * (93.272 + 13.22935 * d);
  const l = L + RAD * 6.289 * Math.sin(M), b = RAD * 5.128 * Math.sin(F);
  const H = sidereal(d, RAD * -lon) - ra(l, b);
  return alt(H, RAD * lat, dec(l, b)) / RAD;
}

/* ------------------------------------------------------------ Fahrzeug (Front oben, Mitte 122.5/349.5) */
const VEHICLE_SVG = `<defs><pattern id="hc-cells" width="12.1" height="11.7" patternUnits="userSpaceOnUse"><rect width="12.1" height="11.7" fill="#1b2232"/><path d="M12.1 0V11.7M0 11.7H12.1" stroke="#2c3850" stroke-width="0.8"/></pattern><linearGradient id="hc-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b7189"/><stop offset="1" stop-color="#34465a"/></linearGradient></defs><g stroke-linejoin="round"><rect x="-10" y="34" width="12" height="26" rx="3" fill="#3f4134" stroke="#262820" stroke-width="1.5"/><rect x="243" y="34" width="12" height="26" rx="3" fill="#3f4134" stroke="#262820" stroke-width="1.5"/><rect x="12" y="-4" width="221" height="16" rx="4" fill="#3a3c30" stroke="#262820" stroke-width="1.5"/><rect x="16" y="-2" width="16" height="7" rx="2" fill="#e8962e"/><rect x="213" y="-2" width="16" height="7" rx="2" fill="#e8962e"/><rect x="8" y="8" width="229" height="208" rx="14" fill="#5f6249" stroke="#2f3126" stroke-width="2"/><rect x="22" y="22" width="201" height="180" rx="10" fill="#7c8277" stroke="#4b4f43" stroke-width="1.5"/><rect x="44.5" y="59.5" width="156" height="105" rx="10" fill="#80867b" stroke="#62675b" stroke-width="2"/><rect x="52.5" y="67.5" width="140" height="89" rx="7" fill="#868c81" stroke="#5c6155" stroke-width="1.5"/><rect x="59.5" y="74.5" width="126" height="75" rx="5" fill="#8a9085" stroke="#6b7064" stroke-width="1"/><rect x="30" y="216" width="185" height="14" fill="#2a2c23"/><rect x="0" y="228" width="245" height="466" rx="6" fill="#5f6249" stroke="#2f3126" stroke-width="2"/><rect x="5" y="233" width="235" height="456" rx="4" fill="#e7ecee" stroke="#b9c2c6" stroke-width="1"/><g stroke="#c9d0d4" stroke-width="2.5"><rect x="14" y="250" width="70" height="145" fill="url(#hc-cells)"/><rect x="88" y="250" width="70" height="145" fill="url(#hc-cells)"/><rect x="162" y="250" width="70" height="145" fill="url(#hc-cells)"/><rect x="14" y="399" width="70" height="145" fill="url(#hc-cells)"/><rect x="88" y="399" width="70" height="145" fill="url(#hc-cells)"/><rect x="162" y="399" width="70" height="145" fill="url(#hc-cells)"/></g><rect x="76" y="566" width="88" height="66" rx="5" fill="#f4f7f8" stroke="#aab4b9" stroke-width="2"/><rect x="83" y="573" width="74" height="52" rx="3" fill="url(#hc-glass)"/><circle cx="214" cy="574" r="9" fill="#fbfcfd" stroke="#8c979d" stroke-width="1.8"/><circle cx="214" cy="574" r="3.5" fill="#d9dee1"/><circle cx="214" cy="600" r="5" fill="#fbfcfd" stroke="#8c979d" stroke-width="1.8"/><rect x="207" y="614" width="14" height="22" rx="7" fill="#f1f3f4" stroke="#8c979d" stroke-width="1.8"/><rect x="158" y="649" width="30" height="27" rx="3" fill="#dfe3e6" stroke="#7e898f" stroke-width="1.8"/><rect x="162" y="653" width="22" height="19" rx="2" fill="#eef1f3"/><rect x="197" y="645" width="35" height="35" rx="2" fill="#f7f9fa" stroke="#a3adb2" stroke-width="1.5"/><circle cx="214.5" cy="662.5" r="6" fill="#26292d" stroke="#5c6166" stroke-width="1"/><circle cx="214.5" cy="662.5" r="1.8" fill="#9aa1a7"/><rect x="16" y="690" width="213" height="9" rx="3" fill="#3a3c30" stroke="#262820" stroke-width="1.5"/><rect x="18" y="692" width="14" height="5" rx="1.5" fill="#c4302b"/><rect x="213" y="692" width="14" height="5" rx="1.5" fill="#c4302b"/></g>`;

/* ------------------------------------------------------------ Texte */
const T = {
  de: {
    heading: "Ausrichtung", sun: "Sonne", moon: "Mond", shade: "Schatten", rel_r: "rechts", rel_l: "links",
    bow: "vom Bug", dawn: "Dämmerung", noon: "Mittag", dusk: "Dämmerung", night: "Nacht",
    view_vehicle: "Fahrzeug dreht", view_ring: "Ring dreht", unavailable: "nicht verfügbar",
    dirs: ["N","NNO","NO","ONO","O","OSO","SO","SSO","S","SSW","SW","WSW","W","WNW","NW","NNW"], cardinals: ["N","O","S","W"],
    shadeText: { links: "Fahrerseite", rechts: "Beifahrerseite", front: "Front", heck: "Heck", keine: "–" },
    phases: { neumond: "Neumond", zunehmende_sichel: "Zunehmende Sichel", erstes_viertel: "Erstes Viertel",
      zunehmender_mond: "Zunehmender Mond", vollmond: "Vollmond", abnehmender_mond: "Abnehmender Mond",
      letztes_viertel: "Letztes Viertel", abnehmende_sichel: "Abnehmende Sichel" },
  },
  en: {
    heading: "Heading", sun: "Sun", moon: "Moon", shade: "Shade", rel_r: "right", rel_l: "left",
    bow: "of bow", dawn: "Dawn", noon: "Noon", dusk: "Dusk", night: "Night",
    view_vehicle: "Vehicle rotates", view_ring: "Ring rotates", unavailable: "unavailable",
    dirs: ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"], cardinals: ["N","E","S","W"],
    shadeText: { links: "Driver side", rechts: "Passenger side", front: "Front", heck: "Rear", keine: "–" },
    phases: { neumond: "New moon", zunehmende_sichel: "Waxing crescent", erstes_viertel: "First quarter",
      zunehmender_mond: "Waxing gibbous", vollmond: "Full moon", abnehmender_mond: "Waning gibbous",
      letztes_viertel: "Last quarter", abnehmende_sichel: "Waning crescent" },
  },
};

const E_ = {
  sunAz: "sensor.ha_compass_sonne_azimut", sunEl: "sensor.ha_compass_sonne_hoehe",
  dawn: "sensor.ha_compass_daemmerung_beginn", rise: "sensor.ha_compass_sonnenaufgang",
  noon: "sensor.ha_compass_sonnenmittag", set: "sensor.ha_compass_sonnenuntergang", dusk: "sensor.ha_compass_daemmerung_ende",
  moonAz: "sensor.ha_compass_mond_azimut", moonEl: "sensor.ha_compass_mond_hoehe",
  moonIllum: "sensor.ha_compass_mond_beleuchtung", moonPhase: "sensor.ha_compass_mond_phase",
  moonRise: "sensor.ha_compass_mondaufgang", moonSet: "sensor.ha_compass_monduntergang",
  rel: "sensor.ha_compass_sonne_relativ", shade: "sensor.ha_compass_schattenseite", view: "select.ha_compass_ansicht",
};

const fmt = (n, d = 0) => (n == null || isNaN(n) ? "–" : Number(n).toFixed(d));

/* Mondsichel als SVG-Pfad; phase 0 = Neumond, 0.5 = Vollmond (Nordhalbkugel: zunehmend rechts hell). */
function moonPath(cx, cy, r, phase) {
  const k = Math.cos(2 * Math.PI * phase), rx = Math.abs(k) * r, top = `${cx} ${cy - r}`, bot = `${cx} ${cy + r}`;
  if (phase <= 0.5) {
    const s = phase < 0.25 ? 0 : 1;
    return `M${top}A${r} ${r} 0 0 1 ${bot}A${rx} ${r} 0 0 ${s} ${top}Z`;
  }
  const s = phase > 0.75 ? 1 : 0;
  return `M${top}A${r} ${r} 0 0 0 ${bot}A${rx} ${r} 0 0 ${s} ${top}Z`;
}

class HaCompassCard extends HTMLElement {
  static getStubConfig() {
    return { heading_entity: "sensor.camper_kompass_ausrichtung_geografisch" };
  }

  static getConfigForm() {
    return {
      schema: [
        { name: "heading_entity", required: true, selector: { entity: { domain: "sensor" } } },
        { name: "title", selector: { text: {} } },
        { name: "view", selector: { select: { mode: "dropdown", options: [
          { value: "auto", label: "Aus HA (select.ha_compass_ansicht)" },
          { value: "vehicle", label: "Fahrzeug dreht" }, { value: "ring", label: "Ring dreht" } ] } } },
        { type: "grid", name: "", schema: [
          { name: "show_info", selector: { boolean: {} } },
          { name: "show_horizon", selector: { boolean: {} } },
          { name: "show_moon_path", selector: { boolean: {} } },
        ] },
        { name: "vehicle_image", selector: { text: {} } },
      ],
      computeLabel: (s) => ({
        heading_entity: "Ausrichtung (Entität)", title: "Titel", view: "Ansicht",
        show_info: "Infospalte", show_horizon: "Horizontverlauf", show_moon_path: "Mondverlauf im Horizont",
        vehicle_image: "Eigenes Fahrzeugbild (URL, Front oben)",
      }[s.name]),
    };
  }

  setConfig(config) {
    if (!config.heading_entity) throw new Error("heading_entity fehlt");
    this._config = { view: "auto", show_info: true, show_horizon: true, show_moon_path: true, ...config };
    this._sig = null;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._render();
  }

  getCardSize() { return this._config?.show_horizon === false ? 5 : 7; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }

  set hass(hass) {
    this._hass = hass;
    const ids = [this._config.heading_entity, ...Object.values(E_)];
    const sig = ids.map((e) => hass.states[e]?.state).join("|") + "|" + (hass.themes?.darkMode ? 1 : 0) + "|" + Math.floor(Date.now() / 60000);
    if (sig === this._sig) return;
    this._sig = sig;
    this._render();
  }

  _t() {
    const lang = (this._hass?.locale?.language || this._hass?.language || "de").slice(0, 2);
    return T[lang] || T.en;
  }

  _num(id) { const s = this._hass?.states[id]; const v = s ? parseFloat(s.state) : NaN; return isNaN(v) ? null : v; }
  _time(id) { const s = this._hass?.states[id]; const v = s ? Date.parse(s.state) : NaN; return isNaN(v) ? null : v; }
  _attr(id, a) { return this._hass?.states[id]?.attributes?.[a]; }

  _hm(ts) {
    if (ts == null) return "–";
    return new Intl.DateTimeFormat(this._hass?.locale?.language || "de", {
      hour: "2-digit", minute: "2-digit", timeZone: this._tz(),
    }).format(new Date(ts));
  }

  _tz() {
    return this._hass?.locale?.time_zone === "local" ? undefined : this._hass?.config?.time_zone;
  }

  /* Mitternacht des heutigen Tages in der HA-Zeitzone (ms). */
  _dayStart(now) {
    const tz = this._tz();
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(new Date(now)).map((x) => [x.type, x.value]));
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    const offset = asUtc - Math.floor(now / 1000) * 1000;
    return Date.UTC(+p.year, +p.month - 1, +p.day) - offset;
  }

  _viewMode() {
    const v = this._config.view;
    if (v === "vehicle" || v === "ring") return v;
    return this._hass?.states[E_.view]?.state === "ring_dreht" ? "ring" : "vehicle";
  }

  _toggleView() {
    if (!this._hass) return;
    if (this._config.view === "auto" && this._hass.states[E_.view]) {
      this._hass.callService("select", "select_next", { entity_id: E_.view, cycle: true });
    } else {
      this._localView = this._viewMode() === "vehicle" ? "ring" : "vehicle";
      this._config = { ...this._config, view: this._localView };
      this._sig = null; this._render();
    }
  }

  /* Drehwinkel ohne Sprung über 0/360° (kürzester Weg für die CSS-Transition). */
  _smooth(key, target) {
    this._angles = this._angles || {};
    const prev = this._angles[key];
    if (prev == null) { this._angles[key] = target; return target; }
    const delta = ((target - prev) % 360 + 540) % 360 - 180;
    this._angles[key] = prev + delta;
    return this._angles[key];
  }

  _render() {
    if (!this.shadowRoot || !this._config) return;
    const t = this._t();
    if (!this._hass) { this.shadowRoot.innerHTML = ""; return; }

    const heading = this._num(this._config.heading_entity);
    const mode = this._viewMode();
    const h = heading ?? 0;
    const ringRot = mode === "ring" ? this._smooth("ring", -h) : this._smooth("ring", 0);
    const vehRot = mode === "vehicle" ? this._smooth("veh", h) : this._smooth("veh", 0);

    const sunAz = this._num(E_.sunAz), sunEl = this._num(E_.sunEl);
    const riseAz = this._attr(E_.rise, "azimut"), setAz = this._attr(E_.set, "azimut");
    const moonAz = this._num(E_.moonAz), moonEl = this._num(E_.moonEl);
    const illum = this._num(E_.moonIllum);
    const phaseVal = this._attr(E_.moonPhase, "phase") ?? 0.5;
    const phaseKey = this._hass.states[E_.moonPhase]?.state;
    const rel = this._num(E_.rel), shade = this._hass.states[E_.shade]?.state;

    /* ---------- Kompass (viewBox 400 × 400, Mitte 200/200) */
    const C = 200, R = 160, RS = 178;
    const pt = (az, r) => [C + r * Math.sin(az * RAD), C - r * Math.cos(az * RAD)];
    const arc = (a0, a1, r) => {
      const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r);
      const large = ((a1 - a0) % 360 + 360) % 360 > 180 ? 1 : 0;
      return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    };
    let ticks = "";
    for (let d = 0; d < 360; d += 5) {
      const L = d % 90 === 0 ? 14 : d % 30 === 0 ? 9 : 5;
      const [x1, y1] = pt(d, R), [x2, y2] = pt(d, R - L);
      ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${d % 30 === 0 ? "tk" : "tm"}" stroke-width="${d % 90 === 0 ? 2.2 : 1.2}"/>`;
    }
    const labels = t.cardinals.map((l, i) => {
      const [x, y] = pt(i * 90, R - 32);
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="${i === 0 ? "north" : "card"}" transform="rotate(${-ringRot} ${x.toFixed(1)} ${y.toFixed(1)})">${l}</text>`;
    }).join("");

    let sunPath = "", sunMark = "", sunRay = "";
    if (riseAz != null && setAz != null) {
      sunPath = `<path d="${arc(riseAz, setAz, RS)}" class="sunpath"/>`;
      if (sunEl != null && sunEl > 0 && sunAz != null) sunPath += `<path d="${arc(riseAz, sunAz, RS)}" class="sunpast"/>`;
    }
    if (sunAz != null && sunEl != null && sunEl > -6) {
      const [sx, sy] = pt(sunAz, RS), [rx, ry] = pt(sunAz, R - 4);
      const up = sunEl > 0;
      sunRay = up ? `<line x1="${C}" y1="${C}" x2="${rx.toFixed(1)}" y2="${ry.toFixed(1)}" class="ray"/>` : "";
      sunMark = `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="11" class="sun${up ? "" : " below"}"/>`;
    }
    let moonMark = "";
    if (moonAz != null && moonEl != null) {
      const [mx, my] = pt(moonAz, RS);
      moonMark = `<g class="moon${moonEl > 0 ? "" : " below"}" transform="rotate(${-ringRot} ${mx.toFixed(1)} ${my.toFixed(1)})">
        <circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="10" class="moondark"/>
        <path d="${moonPath(mx, my, 10, phaseVal)}" class="moonlit"/></g>`;
    }
    const veh = this._config.vehicle_image
      ? `<image href="${this._config.vehicle_image}" x="-60" y="-120" width="120" height="240" preserveAspectRatio="xMidYMid meet"/>`
      : `<g transform="scale(${(250 / 711).toFixed(4)}) translate(-122.5 -349.5)">${VEHICLE_SVG}</g>`;

    const compass = `
<svg class="compass" viewBox="0 0 400 400" role="img" aria-label="${t.heading} ${fmt(heading)}°">
  <circle cx="${C}" cy="${C}" r="${RS + 14}" class="bezel"/>
  <circle cx="${C}" cy="${C}" r="${R}" class="face"/>
  <g class="rot" style="transform:rotate(${ringRot}deg)">
    ${sunPath}${ticks}${labels}${sunRay}${sunMark}${moonMark}
  </g>
  <g class="rot" style="transform:rotate(${vehRot}deg)"><g transform="translate(${C} ${C})">${veh}</g></g>
  ${mode === "ring" ? `<path d="M${C} ${C - RS - 4}l-8 -11h16z" class="bow"/>` : ""}
</svg>`;

    /* ---------- Infospalte */
    const dir = heading == null ? "" : t.dirs[Math.floor(((h % 360) + 11.25) / 22.5) % 16];
    const relTxt = rel == null || sunEl == null || sunEl <= 0 ? "" :
      `${t.sun} ${fmt(Math.abs(rel))}° ${rel > 0 ? t.rel_r : t.rel_l} ${t.bow}`;
    const info = !this._config.show_info ? "" : `
<div class="info">
  <div class="lbl">${t.heading}</div>
  <div class="big">${heading == null ? "–" : fmt(((h % 360) + 360) % 360)}<span class="deg">°</span> <span class="dir">${dir}</span></div>
  <div class="row"><span class="dot sun"></span>${t.sun} <b>${fmt(sunAz)}°</b> · ${fmt(sunEl)}°</div>
  <div class="row sub">↑ ${this._hm(this._time(E_.rise))} · ${fmt(riseAz)}° &nbsp; ↓ ${this._hm(this._time(E_.set))} · ${fmt(setAz)}°</div>
  <div class="row"><svg class="mi" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" class="moondark"/><path d="${moonPath(12, 12, 9, phaseVal)}" class="moonlit"/></svg>${t.moon} <b>${fmt(moonAz)}°</b> · ${fmt(moonEl)}°</div>
  <div class="row sub">${t.phases[phaseKey] || ""}${illum != null ? ` · ${fmt(illum)} %` : ""}</div>
  <div class="row sub">↑ ${this._hm(this._time(E_.moonRise))} &nbsp; ↓ ${this._hm(this._time(E_.moonSet))}</div>
  ${relTxt ? `<div class="shade"><div class="lbl">${t.shade}</div><div class="sv">${t.shadeText[shade] || "–"}</div><div class="sub">${relTxt}</div></div>` : ""}
  <button class="view" title="Ansicht umschalten">${mode === "vehicle" ? t.view_vehicle : t.view_ring}</button>
</div>`;

    /* ---------- Horizontverlauf */
    let horizon = "";
    if (this._config.show_horizon) {
      const lat = this._hass.config.latitude, lon = this._hass.config.longitude, now = Date.now();
      const d0 = this._dayStart(now), W = 600, H = 90, top = 8, base = 70;
      const sx = (ts) => ((ts - d0) / DAY_MS) * W, pct = (ts) => (((ts - d0) / DAY_MS) * 100).toFixed(2);
      const sun = [], moon = [];
      for (let i = 0; i <= 144; i++) {
        const ts = d0 + i * 600000;
        sun.push([sx(ts), sunElevation(ts, lat, lon)]);
        if (this._config.show_moon_path) moon.push([sx(ts), moonElevation(ts, lat, lon)]);
      }
      const maxEl = Math.max(20, ...sun.map((p) => p[1]), ...moon.map((p) => p[1])) + 5;
      const sy = (el) => el >= 0 ? base - (el / maxEl) * (base - top) : base + (Math.min(-el, 18) / 18) * (H - 2 - base);
      const poly = (p) => "M" + p.map(([x, e]) => `${x.toFixed(1)} ${sy(e).toFixed(1)}`).join("L");
      const marks = [[E_.dawn, t.dawn], [E_.rise, "↑"], [E_.noon, t.noon], [E_.set, "↓"], [E_.dusk, t.dusk]]
        .map(([id, l], i) => {
          const ts = this._time(id); if (ts == null || ts < d0 || ts > d0 + DAY_MS) return null;
          return { ts, l, row: i === 0 || i === 4 ? 1 : 0 };
        }).filter(Boolean);
      const ticks = marks.map((m) => `<line x1="${sx(m.ts).toFixed(1)}" y1="${base - 4}" x2="${sx(m.ts).toFixed(1)}" y2="${base + 4}" class="hz"/>`).join("");
      const texts = marks.map((m) => `<div class="ht r${m.row}" style="left:${pct(m.ts)}%">${m.l} ${this._hm(m.ts)}</div>`).join("");
      const nowEl = sunEl ?? sunElevation(now, lat, lon), nx = sx(now), ny = sy(nowEl);
      horizon = `
<div class="hwrap">
<svg class="horizon" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
  <defs><clipPath id="above"><rect x="0" y="0" width="${W}" height="${base}"/></clipPath>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f59e0b" stop-opacity="0.3"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0"/></linearGradient></defs>
  ${moon.length ? `<path d="${poly(moon)}" class="mpath" clip-path="url(#above)"/>` : ""}
  <path d="${poly(sun)}L${W} ${base}L0 ${base}Z" fill="url(#sky)" clip-path="url(#above)"/>
  <path d="${poly(sun)}" class="spath-below"/>
  <path d="${poly(sun)}" class="spath" clip-path="url(#above)"/>
  <line x1="0" y1="${base}" x2="${W}" y2="${base}" class="hz"/>
  ${ticks}
  <line x1="${nx.toFixed(1)}" y1="0" x2="${nx.toFixed(1)}" y2="${base}" class="now"/>
</svg>
<div class="nowdot${nowEl > 0 ? "" : " below"}" style="left:${pct(now)}%;top:${((sy(nowEl) / H) * 100).toFixed(1)}%"></div>
<div class="htexts">${texts}</div>
</div>`;
    }

    this.shadowRoot.innerHTML = `
<style>
  :host { --amber: #f59e0b; --sun: #fbbf24; --north: #ef4444; }
  ha-card { padding: 16px; overflow: hidden; container-type: inline-size; }
  .title { font-size: 1.1em; font-weight: 500; margin: 0 0 8px; color: var(--primary-text-color); }
  .main { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  @container (min-width: 520px) { .main { flex-direction: row; align-items: center; } .compass { flex: 0 0 58%; } }
  .compass { width: 100%; max-width: 420px; cursor: pointer; display: block; }
  .bezel { fill: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .face { fill: var(--card-background-color, #fff); stroke: var(--divider-color, #ddd); stroke-width: 2; }
  .tk { stroke: var(--primary-text-color); } .tm { stroke: var(--secondary-text-color); opacity: .7; }
  text.card, text.north { font: 700 18px var(--ha-font-family-body, sans-serif); text-anchor: middle; dominant-baseline: central; fill: var(--primary-text-color); }
  text.north { fill: var(--north); }
  .rot { transform-box: view-box; transform-origin: 200px 200px; transition: transform .8s cubic-bezier(.3,.7,.3,1); }
  .sunpath { fill: none; stroke: var(--amber); stroke-opacity: .3; stroke-width: 6; stroke-linecap: round; }
  .sunpast { fill: none; stroke: var(--amber); stroke-width: 6; stroke-linecap: round; }
  .ray { stroke: var(--amber); stroke-width: 1.5; stroke-dasharray: 4 4; opacity: .7; }
  .sun { fill: var(--sun); stroke: var(--card-background-color, #fff); stroke-width: 3; }
  .sun.below { fill: none; stroke: var(--sun); stroke-width: 2; stroke-dasharray: 3 3; }
  .moondark { fill: var(--secondary-text-color); opacity: .35; }
  .moonlit { fill: #e2e8f0; stroke: none; }
  .moon.below { opacity: .45; }
  .bow { fill: var(--primary-text-color); }
  .info { flex: 1; min-width: 0; width: 100%; color: var(--primary-text-color); font-size: 14px; line-height: 1.75; }
  .lbl { font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--secondary-text-color); }
  .big { font-size: 40px; font-weight: 600; line-height: 1.1; margin-bottom: 8px; }
  .deg { font-weight: 400; } .dir { font-size: 22px; color: var(--secondary-text-color); font-weight: 500; }
  .row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; } .sub { color: var(--secondary-text-color); font-size: 13px; }
  .dot.sun { width: 10px; height: 10px; border-radius: 50%; background: var(--sun); display: inline-block; border: 0; }
  .mi { width: 14px; height: 14px; }
  .shade { margin-top: 8px; } .sv { font-size: 17px; font-weight: 500; }
  .view { margin-top: 10px; font: inherit; font-size: 13px; color: var(--primary-text-color); background: var(--secondary-background-color, rgba(127,127,127,.12));
          border: 1px solid var(--divider-color, #ccc); border-radius: 10px; padding: 6px 12px; cursor: pointer; }
  .hwrap { position: relative; margin: 10px 4px 0; }
  .horizon { width: 100%; height: 90px; display: block; }
  .horizon * { vector-effect: non-scaling-stroke; }
  .nowdot { position: absolute; width: 12px; height: 12px; margin: -6px 0 0 -6px; border-radius: 50%; background: var(--sun);
            border: 2px solid var(--card-background-color, #fff); box-sizing: border-box; }
  .nowdot.below { background: none; border: 2px dashed var(--sun); }
  .htexts { position: relative; height: 34px; }
  .htexts .ht { position: absolute; transform: translateX(-50%); white-space: nowrap; }
  .htexts .r0 { top: 2px; color: var(--primary-text-color); } .htexts .r1 { top: 17px; }
  .hz { stroke: var(--divider-color, #ccc); stroke-width: 1; }
  .ht { font-size: 11px; color: var(--secondary-text-color); }
  .spath { fill: none; stroke: var(--amber); stroke-width: 2.5; }
  .spath-below { fill: none; stroke: var(--secondary-text-color); stroke-width: 1.2; stroke-dasharray: 3 3; opacity: .6; }
  .mpath { fill: none; stroke: var(--secondary-text-color); stroke-width: 1.2; opacity: .55; }
  .now { stroke: var(--secondary-text-color); stroke-width: 1; stroke-dasharray: 2 3; }
  .warn { color: var(--error-color, #db4437); }
</style>
<ha-card>
  ${this._config.title ? `<div class="title">${this._config.title}</div>` : ""}
  ${heading == null ? `<div class="warn">${this._config.heading_entity}: ${t.unavailable}</div>` : ""}
  <div class="main">${compass}${info}</div>
  ${horizon}
</ha-card>`;
    this.shadowRoot.querySelector(".compass")?.addEventListener("click", () => this._toggleView());
    this.shadowRoot.querySelector(".view")?.addEventListener("click", () => this._toggleView());
  }
}

if (!customElements.get("ha-compass-card")) {
  customElements.define("ha-compass-card", HaCompassCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "ha-compass-card", name: "HA Compass",
    description: "Kompass mit Fahrzeug, Sonnen- und Mondstand und Horizontverlauf",
    preview: false, documentationURL: "https://github.com/trinler007/HA-Compass",
  });
  console.info(`%c HA-COMPASS-CARD %c ${CARD_VERSION} `, "background:#f59e0b;color:#000", "background:#333;color:#fff");
}
