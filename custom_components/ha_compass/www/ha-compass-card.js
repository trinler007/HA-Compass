/*
 * HA Compass Card – Kompass mit Fahrzeug, Sonnen- und Mondstand, Horizontverlauf.
 * Teil von HA-Compass (Apache-2.0). Sonnen-/Mondberechnung: SunCalc-Port
 * (BSD-2-Clause, © 2014 Vladimir Agafonkin) – siehe NOTICE.
 */
const CARD_VERSION = "0.4.1";

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

/* Visueller Editor: blendet Standardwerte ein, damit Schalter den echten Zustand zeigen,
   und speichert nur Werte, die vom Standard abweichen. */
class HaCompassEditor extends HTMLElement {
  setConfig(config) { this._config = config; this._render(); }
  set hass(hass) { this._hass = hass; if (this._form) this._form.hass = hass; }
  _render() {
    const card = customElements.get(this.cardType);
    if (!card) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (ev) => {
        const out = {};
        for (const [k, v] of Object.entries(ev.detail.value)) {
          if (v === undefined || v === "" || v === null) continue;
          if (k !== "type" && card.DEFAULTS[k] === v) continue;
          out[k] = v;
        }
        out.type = this._config.type;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: out }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const form = card.getConfigForm();
    this._form.schema = form.schema;
    this._form.computeLabel = form.computeLabel;
    this._form.data = { ...card.DEFAULTS, ...this._config };
    if (this._hass) this._form.hass = this._hass;
  }
}
class HaCompassCardEditor extends HaCompassEditor { get cardType() { return "ha-compass-card"; } }
class HaLevelCardEditor extends HaCompassEditor { get cardType() { return "ha-level-card"; } }

class HaCompassCard extends HTMLElement {
  static getConfigElement() { return document.createElement("ha-compass-card-editor"); }

  static getStubConfig() {
    return { heading_entity: "sensor.camper_kompass_ausrichtung_geografisch" };
  }

  static getConfigForm() {
    const bool = (name) => ({ name, selector: { boolean: {} } });
    return {
      schema: [
        { name: "heading_entity", required: true, selector: { entity: { domain: "sensor" } } },
        { name: "title", selector: { text: {} } },
        { name: "view", selector: { select: { mode: "dropdown", options: [
          { value: "auto", label: "Aus HA (select.ha_compass_ansicht)" },
          { value: "vehicle", label: "Fahrzeug dreht" }, { value: "ring", label: "Ring dreht" } ] } } },
        { type: "expandable", name: "", title: "Kompass", flatten: true, schema: [
          { type: "grid", name: "", schema: [
            bool("show_compass"), bool("show_vehicle"), bool("show_ticks"), bool("show_cardinals"),
            bool("show_sun"), bool("show_sun_path"), bool("show_moon"), bool("show_bow_marker"),
          ] },
          { name: "tap_action", selector: { select: { mode: "dropdown", options: [
            { value: "toggle_view", label: "Ansicht umschalten" }, { value: "none", label: "Keine" } ] } } },
          { name: "compass_size", selector: { number: { min: 120, max: 800, step: 10, unit_of_measurement: "px", mode: "box" } } },
          { name: "vehicle_image", selector: { text: {} } },
        ] },
        { type: "expandable", name: "", title: "Infospalte", flatten: true, schema: [
          { type: "grid", name: "", schema: [
            bool("show_info"), bool("show_heading"), bool("show_sun_info"), bool("show_moon_info"),
            bool("show_shade"), bool("show_view_button"),
          ] },
        ] },
        { type: "expandable", name: "", title: "Horizontverlauf", flatten: true, schema: [
          { type: "grid", name: "", schema: [ bool("show_horizon"), bool("show_moon_path") ] },
        ] },
      ],
      computeLabel: (s) => ({
        heading_entity: "Ausrichtung (Entität)", title: "Titel", view: "Ansicht",
        show_compass: "Kompass", show_vehicle: "Fahrzeug", show_ticks: "Skala", show_cardinals: "Himmelsrichtungen",
        show_sun: "Sonne", show_sun_path: "Sonnenbahn", show_moon: "Mond", show_bow_marker: "Bug-Markierung (Ring dreht)",
        tap_action: "Tippen auf den Kompass", compass_size: "Max. Kompassgröße",
        vehicle_image: "Eigenes Fahrzeugbild (URL, Front oben)",
        show_info: "Infospalte", show_heading: "Ausrichtung", show_sun_info: "Sonne", show_moon_info: "Mond",
        show_shade: "Schatten", show_view_button: "Umschalter Ansicht",
        show_horizon: "Horizontverlauf", show_moon_path: "Mondverlauf",
      }[s.name]),
    };
  }

  static DEFAULTS = {
    view: "auto", tap_action: "toggle_view",
    show_compass: true, show_vehicle: true, show_ticks: true, show_cardinals: true,
    show_sun: true, show_sun_path: true, show_moon: true, show_bow_marker: true,
    show_info: true, show_heading: true, show_sun_info: true, show_moon_info: true,
    show_shade: true, show_view_button: true,
    show_horizon: true, show_moon_path: true,
  };

  setConfig(config) {
    if (!config.heading_entity) throw new Error("heading_entity fehlt");
    this._config = { ...HaCompassCard.DEFAULTS, ...config };
    this._sig = null;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._render();
  }

  getCardSize() {
    const c = this._config || {};
    return (c.show_compass ? 5 : 0) + (c.show_info && !c.show_compass ? 4 : 0) + (c.show_horizon ? 2 : 0) || 1;
  }
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

    const cfg = this._config;
    const heading = this._num(cfg.heading_entity);
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
<svg class="compass${cfg.tap_action === "none" ? " notap" : ""}" style="${cfg.compass_size ? `max-width:${cfg.compass_size}px` : ""}" viewBox="0 0 400 400" role="img" aria-label="${t.heading} ${fmt(heading)}°">
  <circle cx="${C}" cy="${C}" r="${RS + 14}" class="bezel"/>
  <circle cx="${C}" cy="${C}" r="${R}" class="face"/>
  <g class="rot" style="transform:rotate(${ringRot}deg)">
    ${cfg.show_sun_path ? sunPath : ""}${cfg.show_ticks ? ticks : ""}${cfg.show_cardinals ? labels : ""}${cfg.show_sun ? sunRay + sunMark : ""}${cfg.show_moon ? moonMark : ""}
  </g>
  ${cfg.show_vehicle ? `<g class="rot" style="transform:rotate(${vehRot}deg)"><g transform="translate(${C} ${C})">${veh}</g></g>` : ""}
  ${mode === "ring" && cfg.show_bow_marker ? `<path d="M${C} ${C - RS - 4}l-8 -11h16z" class="bow"/>` : ""}
</svg>`;

    /* ---------- Infospalte */
    const dir = heading == null ? "" : t.dirs[Math.floor(((h % 360) + 11.25) / 22.5) % 16];
    const relTxt = rel == null || sunEl == null || sunEl <= 0 ? "" :
      `${t.sun} ${fmt(Math.abs(rel))}° ${rel > 0 ? t.rel_r : t.rel_l} ${t.bow}`;
    const showInfo = cfg.show_info && (cfg.show_heading || cfg.show_sun_info || cfg.show_moon_info || cfg.show_shade || cfg.show_view_button);
    const info = !showInfo ? "" : `
<div class="info">
  ${cfg.show_heading ? `<div class="lbl">${t.heading}</div>
  <div class="big">${heading == null ? "–" : fmt(((h % 360) + 360) % 360)}<span class="deg">°</span> <span class="dir">${dir}</span></div>` : ""}
  ${cfg.show_sun_info ? `<div class="row"><span class="dot sun"></span>${t.sun} <b>${fmt(sunAz)}°</b> · ${fmt(sunEl)}°</div>
  <div class="row sub">↑ ${this._hm(this._time(E_.rise))} · ${fmt(riseAz)}° &nbsp; ↓ ${this._hm(this._time(E_.set))} · ${fmt(setAz)}°</div>` : ""}
  ${cfg.show_moon_info ? `<div class="row"><svg class="mi" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" class="moondark"/><path d="${moonPath(12, 12, 9, phaseVal)}" class="moonlit"/></svg>${t.moon} <b>${fmt(moonAz)}°</b> · ${fmt(moonEl)}°</div>
  <div class="row sub">${t.phases[phaseKey] || ""}${illum != null ? ` · ${fmt(illum)} %` : ""}</div>
  <div class="row sub">↑ ${this._hm(this._time(E_.moonRise))} &nbsp; ↓ ${this._hm(this._time(E_.moonSet))}</div>` : ""}
  ${cfg.show_shade && relTxt ? `<div class="shade"><div class="lbl">${t.shade}</div><div class="sv">${t.shadeText[shade] || "–"}</div><div class="sub">${relTxt}</div></div>` : ""}
  ${cfg.show_view_button ? `<button class="view" title="Ansicht umschalten">${mode === "vehicle" ? t.view_vehicle : t.view_ring}</button>` : ""}
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
  .compass { width: 100%; max-width: 420px; cursor: pointer; display: block; margin: 0 auto; }
  .compass.notap { cursor: default; }
  .main.single { flex-direction: column !important; }
  .main.single .compass { flex: none !important; }
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
  ${cfg.show_compass || info ? `<div class="main${cfg.show_compass && info ? "" : " single"}">${cfg.show_compass ? compass : ""}${info}</div>` : ""}
  ${horizon}
</ha-card>`;
    if (cfg.tap_action !== "none") this.shadowRoot.querySelector(".compass")?.addEventListener("click", () => this._toggleView());
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

/* ============================================================ Nivellier-Karte */
const SIDE_SVG = `<defs> <linearGradient id="lv-sv-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5d7387"/><stop offset="1" stop-color="#2e3b47"/></linearGradient> <linearGradient id="lv-sv-alu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8eaec"/><stop offset=".5" stop-color="#cfd3d6"/><stop offset="1" stop-color="#a9afb4"/></linearGradient> </defs> <g transform="scale(0.38919) translate(-142 -9)" stroke-linejoin="round"> <rect x="700" y="596" width="1130" height="100" fill="#1f2021"/> <path d="M708 40 Q708 30 718 30 L1918 30 Q1930 30 1930 42 L1930 492 L1818 602 L708 602 Z" fill="#a7a296" stroke="#6f6b62" stroke-width="5"/> <path d="M708 30 L1930 30 L1930 48 L708 48 Z" fill="#bdb8ad"/> <rect x="800" y="14" width="26" height="16" rx="4" fill="#1f2021"/><rect x="1088" y="16" width="20" height="14" rx="3" fill="#1f2021"/><rect x="1492" y="20" width="32" height="10" rx="3" fill="#1f2021"/> <rect x="762" y="92" width="96" height="198" rx="4" fill="#bdb8ad" stroke="#7a766c" stroke-width="4"/> <rect x="772" y="102" width="74" height="178" rx="3" fill="url(#lv-sv-glass)"/> <rect x="1168" y="155" width="334" height="160" rx="5" fill="#bdb8ad" stroke="#7a766c" stroke-width="4"/> <rect x="1180" y="166" width="312" height="138" rx="4" fill="url(#lv-sv-glass)"/> <path d="M730 428 H1902 V466 H730 Z" fill="#1f2021"/> <path d="M730 428 L740 406 L750 428 Z M746 428 L758 402 L770 428 Z M766 428 L772 414 L778 428 Z M776 428 L786 406 L796 428 Z M786 428 L800 398 L814 428 Z M812 428 L818 414 L824 428 Z M820 428 L832 402 L844 428 Z M852 428 L858 414 L864 428 Z M870 428 L876 414 L882 428 Z M896 428 L902 414 L908 428 Z M908 428 L916 410 L924 428 Z M916 428 L930 398 L944 428 Z M950 428 L956 414 L962 428 Z M968 428 L974 414 L980 428 Z M982 428 L992 406 L1002 428 Z M1010 428 L1018 410 L1026 428 Z M1018 428 L1032 398 L1046 428 Z M1040 428 L1054 398 L1068 428 Z M1066 428 L1072 414 L1078 428 Z M1080 428 L1090 406 L1100 428 Z M1090 428 L1104 398 L1118 428 Z M1104 428 L1118 398 L1132 428 Z M1118 428 L1132 398 L1146 428 Z M1138 428 L1150 402 L1162 428 Z M1169 428 L1176 412 L1183 428 Z M1186 428 L1198 402 L1210 428 Z M1214 428 L1224 406 L1234 428 Z M1238 428 L1246 410 L1254 428 Z M1253 428 L1264 404 L1275 428 Z M1276 428 L1282 414 L1288 428 Z M1290 428 L1304 398 L1318 428 Z M1320 428 L1330 406 L1340 428 Z M1346 428 L1356 406 L1366 428 Z M1364 428 L1370 414 L1376 428 Z M1388 428 L1396 410 L1404 428 Z M1410 428 L1418 410 L1426 428 Z M1432 428 L1444 402 L1456 428 Z M1447 428 L1458 404 L1469 428 Z M1465 428 L1472 412 L1479 428 Z M1514 428 L1524 406 L1534 428 Z M1532 428 L1546 398 L1560 428 Z M1558 428 L1572 398 L1586 428 Z M1592 428 L1598 414 L1604 428 Z M1602 428 L1612 406 L1622 428 Z M1627 428 L1638 404 L1649 428 Z M1646 428 L1652 414 L1658 428 Z M1663 428 L1674 404 L1685 428 Z M1690 428 L1700 406 L1710 428 Z M1715 428 L1726 404 L1737 428 Z M1742 428 L1748 414 L1754 428 Z M1764 428 L1774 406 L1784 428 Z M1778 428 L1792 398 L1806 428 Z M1794 428 L1806 402 L1818 428 Z M1812 428 L1820 410 L1828 428 Z M1322 438 L1338 398 L1354 438 Z M1325 414 L1338 375 L1351 414 Z M1328 390 L1338 351 L1348 390 Z M1332 367 L1338 327 L1344 367 Z M1349 438 L1362 406 L1375 438 Z M1352 420 L1362 389 L1372 420 Z M1354 403 L1362 371 L1370 403 Z M1357 386 L1362 354 L1367 386 Z M1836 438 L1858 381 L1880 438 Z M1840 400 L1858 344 L1876 400 Z M1845 363 L1858 306 L1871 363 Z M1849 326 L1858 269 L1867 326 Z" fill="#1f2021"/> <path d="M735 420 L758 386 L780 410 L800 398 L830 420 M955 415 L1045 335 L1080 372 L1110 355 L1150 390 L1190 362 L1245 405 L1290 420 M1390 420 L1450 360 L1480 380 L1530 318 L1575 352 L1610 300 L1655 350 L1700 330 L1760 392 L1820 420" fill="none" stroke="#1f2021" stroke-width="9" stroke-linecap="round"/> <path d="M1045 335 L1060 370 M1110 355 L1120 384 M1530 318 L1545 352 M1610 300 L1622 340 M1700 330 L1712 360" fill="none" stroke="#1f2021" stroke-width="6" stroke-linecap="round"/> <rect x="1528" y="348" width="305" height="204" rx="4" fill="none" stroke="#7a766c" stroke-width="4"/> <rect x="1655" y="507" width="50" height="18" rx="6" fill="#bdb8ad" stroke="#6f6b62" stroke-width="3"/> <rect x="748" y="610" width="190" height="152" rx="4" fill="url(#lv-sv-alu)" stroke="#9aa0a5" stroke-width="3"/> <rect x="942" y="610" width="195" height="152" rx="4" fill="url(#lv-sv-alu)" stroke="#9aa0a5" stroke-width="3"/> <rect x="1605" y="612" width="165" height="128" rx="4" fill="url(#lv-sv-alu)" stroke="#9aa0a5" stroke-width="3"/> <rect x="828" y="620" width="30" height="24" rx="4" fill="#8f969b"/><rect x="1025" y="620" width="30" height="24" rx="4" fill="#8f969b"/><rect x="1672" y="622" width="30" height="24" rx="4" fill="#8f969b"/> <path d="M1190 762 L1270 615 L1500 615 L1565 762" fill="none" stroke="#cfd3d6" stroke-width="22"/> <path d="M1700 742 L1848 805" stroke="#1f2021" stroke-width="26" stroke-linecap="round"/> <path d="M178 585 L710 585 L710 700 L672 700 L670 790 L632 790 L630 700 L215 700 L178 690 Z" fill="#161718"/> <path d="M305 665 Q318 528 475 520 Q632 528 648 665 Z" fill="#0f1011"/> <path d="M675 210 L675 600 L648 600 Q632 528 475 520 Q318 528 305 600 L215 600 L213 262 Q216 210 262 208 Z" fill="#a7a296" stroke="#6f6b62" stroke-width="5"/> <rect x="675" y="210" width="35" height="430" fill="#1f2021"/> <path d="M250 238 H445 V365 H250 Z" fill="url(#lv-sv-glass)" stroke="#1f2021" stroke-width="6"/> <rect x="495" y="238" width="147" height="132" rx="22" fill="url(#lv-sv-glass)" stroke="#1f2021" stroke-width="8"/> <path d="M455 222 V545" stroke="#77736a" stroke-width="4"/> <rect x="232" y="425" width="213" height="38" fill="#1f2021"/><rect x="468" y="425" width="189" height="38" fill="#1f2021"/> <rect x="400" y="428" width="30" height="10" rx="3" fill="#3b3d3f"/> <path d="M300 668 Q312 528 475 520 Q632 528 648 668" fill="none" stroke="#6e6f6d" stroke-width="26"/> <path d="M262 214 L238 240 L236 360" fill="none" stroke="#1f2021" stroke-width="7"/> <rect x="232" y="300" width="28" height="62" rx="10" fill="#1f2021"/> <rect x="175" y="478" width="42" height="112" rx="4" fill="#161718"/> <rect x="160" y="522" width="30" height="16" rx="4" fill="#e8962e"/> <rect x="145" y="608" width="72" height="80" rx="6" fill="#3a3c3e" stroke="#161718" stroke-width="4"/> <circle cx="264" cy="652" r="9" fill="#e8962e"/><circle cx="240" cy="622" r="7" fill="#3a3c3e"/> <path d="M222 690 L232 750 M290 690 L282 750" stroke="#161718" stroke-width="7" stroke-linecap="round"/> <circle cx="646" cy="706" r="9" fill="#e8962e"/> <circle cx="475" cy="772" r="140" fill="#1b1b1b"/><circle cx="475" cy="772" r="130.2" fill="none" stroke="#2a2a2a" stroke-width="7.0" stroke-dasharray="8.4 7.0"/><circle cx="475" cy="772" r="78.4" fill="#2b2d2f" stroke="#3a3d40" stroke-width="4"/><circle cx="475" cy="772" r="28.0" fill="#3a3d40"/><circle cx="519.8" cy="772.0" r="6.3" fill="#8b9095"/><circle cx="506.7" cy="803.7" r="6.3" fill="#8b9095"/><circle cx="475.0" cy="816.8" r="6.3" fill="#8b9095"/><circle cx="443.4" cy="803.7" r="6.3" fill="#8b9095"/><circle cx="430.2" cy="772.1" r="6.3" fill="#8b9095"/><circle cx="443.3" cy="740.4" r="6.3" fill="#8b9095"/><circle cx="474.9" cy="727.2" r="6.3" fill="#8b9095"/><circle cx="506.6" cy="740.2" r="6.3" fill="#8b9095"/> <circle cx="1385" cy="778" r="140" fill="#1b1b1b"/><circle cx="1385" cy="778" r="130.2" fill="none" stroke="#2a2a2a" stroke-width="7.0" stroke-dasharray="8.4 7.0"/><circle cx="1385" cy="778" r="78.4" fill="#2b2d2f" stroke="#3a3d40" stroke-width="4"/><circle cx="1385" cy="778" r="28.0" fill="#3a3d40"/><circle cx="1429.8" cy="778.0" r="6.3" fill="#8b9095"/><circle cx="1416.7" cy="809.7" r="6.3" fill="#8b9095"/><circle cx="1385.0" cy="822.8" r="6.3" fill="#8b9095"/><circle cx="1353.4" cy="809.7" r="6.3" fill="#8b9095"/><circle cx="1340.2" cy="778.1" r="6.3" fill="#8b9095"/><circle cx="1353.3" cy="746.4" r="6.3" fill="#8b9095"/><circle cx="1384.9" cy="733.2" r="6.3" fill="#8b9095"/><circle cx="1416.6" cy="746.2" r="6.3" fill="#8b9095"/> </g>`;
const REAR_SVG = `<defs> <linearGradient id="lv-rv-alu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3e6e8"/><stop offset="1" stop-color="#a3a9ae"/></linearGradient> </defs> <g transform="scale(0.40098) translate(-67 -3)" stroke-linejoin="round"> <rect x="82" y="760" width="90" height="103" rx="14" fill="#1b1b1b"/> <rect x="553" y="760" width="92" height="103" rx="14" fill="#1b1b1b"/> <rect x="150" y="595" width="445" height="140" fill="#1f2021"/> <rect x="268" y="590" width="22" height="150" fill="url(#lv-rv-alu)"/><rect x="445" y="590" width="22" height="150" fill="url(#lv-rv-alu)"/> <rect x="80" y="575" width="72" height="200" fill="url(#lv-rv-alu)" stroke="#9aa0a5" stroke-width="3"/> <rect x="595" y="575" width="72" height="200" fill="url(#lv-rv-alu)" stroke="#9aa0a5" stroke-width="3"/> <rect x="90" y="733" width="566" height="30" rx="15" fill="url(#lv-rv-alu)" stroke="#9aa0a5" stroke-width="3"/> <rect x="70" y="5" width="606" height="458" rx="6" fill="#a7a296" stroke="#6f6b62" stroke-width="5"/> <rect x="90" y="24" width="566" height="420" rx="3" fill="none" stroke="#8f8a7f" stroke-width="3"/> <path d="M70 463 H676 V545 L660 560 H86 L70 545 Z" fill="#55524b" stroke="#3d3b36" stroke-width="4"/> <circle cx="86" cy="20" r="7" fill="#e23b2e"/><circle cx="660" cy="20" r="7" fill="#e23b2e"/> <rect x="100" y="560" width="550" height="38" fill="url(#lv-rv-alu)" stroke="#9aa0a5" stroke-width="3"/> <rect x="112" y="565" width="128" height="27" rx="3" fill="#f4f4f4" stroke="#333" stroke-width="2"/> <rect x="112" y="565" width="12" height="27" fill="#2f4fa3"/> <rect x="105" y="600" width="85" height="32" rx="3" fill="#c62828"/><rect x="105" y="600" width="26" height="32" rx="3" fill="#e8962e"/> <rect x="550" y="600" width="86" height="32" rx="3" fill="#c62828"/><rect x="610" y="600" width="26" height="32" rx="3" fill="#e8962e"/> <rect x="238" y="605" width="26" height="22" rx="2" fill="#d8dadb"/><rect x="476" y="605" width="26" height="22" rx="2" fill="#d8dadb"/> </g>`;

const TL = {
  de: { pitch: "Nicken", roll: "Rollen", front: "Front", rear: "Heck", left: "Fahrerseite", right: "Beifahrerseite",
        level: "Waagerecht", raise: "anheben", side: "Seite", lengthwise: "Längs", sideways: "Seitlich", hint: "Hinweis", unavailable: "nicht verfügbar" },
  en: { pitch: "Pitch", roll: "Roll", front: "Front", rear: "Rear", left: "Driver side", right: "Passenger side",
        level: "Level", raise: "raise", side: "Side", lengthwise: "Lengthwise", sideways: "Sideways", hint: "Hint", unavailable: "unavailable" },
};

class HaLevelCard extends HTMLElement {
  static getConfigElement() { return document.createElement("ha-level-card-editor"); }

  static DEFAULTS = {
    wheelbase: 3500, track_width: 1886, bubble_range: 5, tolerance: 0.5, warn: 1.5,
    show_views: true, show_bubble: true, show_values: true, show_hint: true,
  };

  static getStubConfig() {
    return { pitch_entity: "sensor.technik_wasserwaage_truck_pitch", roll_entity: "sensor.technik_wasserwaage_truck_roll" };
  }

  static getConfigForm() {
    const bool = (name) => ({ name, selector: { boolean: {} } });
    const num = (name, min, max, step, unit) => ({ name, selector: { number: { min, max, step, unit_of_measurement: unit, mode: "box" } } });
    return {
      schema: [
        { name: "pitch_entity", required: true, selector: { entity: { domain: "sensor" } } },
        { name: "roll_entity", required: true, selector: { entity: { domain: "sensor" } } },
        { name: "title", selector: { text: {} } },
        { type: "grid", name: "", schema: [bool("show_views"), bool("show_bubble"), bool("show_values"), bool("show_hint")] },
        { type: "expandable", name: "", title: "Fahrzeug & Grenzwerte", flatten: true, schema: [
          { type: "grid", name: "", schema: [
            num("wheelbase", 1000, 8000, 10, "mm"), num("track_width", 1000, 3000, 10, "mm"),
            num("tolerance", 0.1, 5, 0.1, "°"), num("warn", 0.2, 10, 0.1, "°"), num("bubble_range", 1, 20, 1, "°"),
          ] },
        ] },
        { type: "expandable", name: "", title: "Optionale Entitäten (statt Berechnung)", flatten: true, schema: [
          { name: "height_long_entity", selector: { entity: { domain: "sensor" } } },
          { name: "height_side_entity", selector: { entity: { domain: "sensor" } } },
          { name: "hint_entity", selector: { entity: {} } },
        ] },
      ],
      computeLabel: (s) => ({
        pitch_entity: "Nicken (+ = Front höher)", roll_entity: "Rollen (+ = Fahrerseite höher)", title: "Titel",
        show_views: "Fahrzeugansichten", show_bubble: "Libelle", show_values: "Werte", show_hint: "Hinweis",
        wheelbase: "Radstand", track_width: "Spurweite", tolerance: "Toleranz (grün)", warn: "Warnschwelle (gelb)",
        bubble_range: "Libelle Vollausschlag", height_long_entity: "Höhendifferenz längs", height_side_entity: "Höhendifferenz seitlich",
        hint_entity: "Nivellierhinweis",
      }[s.name]),
    };
  }

  setConfig(config) {
    if (!config.pitch_entity || !config.roll_entity) throw new Error("pitch_entity und roll_entity sind erforderlich");
    this._config = { ...HaLevelCard.DEFAULTS, ...config };
    this._sig = null;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._render();
  }

  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }

  set hass(hass) {
    this._hass = hass;
    const c = this._config;
    const sig = [c.pitch_entity, c.roll_entity, c.height_long_entity, c.height_side_entity, c.hint_entity]
      .map((e) => (e ? hass.states[e]?.state : "")).join("|");
    if (sig === this._sig) return;
    this._sig = sig;
    this._render();
  }

  _t() { const l = (this._hass?.locale?.language || "de").slice(0, 2); return TL[l] || TL.en; }
  _num(id) { const s = id && this._hass?.states[id]; const v = s ? parseFloat(s.state) : NaN; return isNaN(v) ? null : v; }
  _fmt(v, d = 1) {
    return v == null ? "–" : new Intl.NumberFormat(this._hass?.locale?.language || "de", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  }
  _cls(v) {
    if (v == null) return "na";
    const a = Math.abs(v);
    return a <= this._config.tolerance ? "ok" : a <= this._config.warn ? "warn" : "bad";
  }

  _render() {
    if (!this.shadowRoot || !this._config) return;
    if (!this._hass) { this.shadowRoot.innerHTML = ""; return; }
    const c = this._config, t = this._t();
    const pitch = this._num(c.pitch_entity), roll = this._num(c.roll_entity);
    const p = pitch ?? 0, r = roll ?? 0;

    /* Höhendifferenzen: aus Entitäten oder aus Radstand/Spurweite (cm) */
    const longCm = c.height_long_entity ? this._num(c.height_long_entity) : (pitch == null ? null : Math.tan(p * RAD) * c.wheelbase / 10);
    const sideCm = c.height_side_entity ? this._num(c.height_side_entity) : (roll == null ? null : Math.tan(r * RAD) * c.track_width / 10);
    let hint = c.hint_entity ? this._hass.states[c.hint_entity]?.state : null;
    if (!hint && pitch != null && roll != null) {
      const parts = [];
      if (Math.abs(p) > c.tolerance) parts.push(`${p > 0 ? t.rear : t.front} ${this._fmt(Math.abs(longCm))} cm ${t.raise}`);
      if (Math.abs(r) > c.tolerance) parts.push(`${r > 0 ? t.right : t.left} ${this._fmt(Math.abs(sideCm))} cm ${t.raise}`);
      hint = parts.length ? parts.join(" · ") : t.level;
    }

    /* Ansichten */
    const view = (svg, vb, ground, angle, label, value, cls, w) => {
      const [x0, , vw] = vb.split(" ").map(Number);
      return `
      <div class="view">
        <svg viewBox="${vb}" class="vsvg" style="max-width:${w}px">
          <line x1="${x0}" y1="${ground}" x2="${x0 + vw}" y2="${ground}" class="horizon"/>
          <g class="tilt" style="transform:rotate(${angle}deg)">${svg}</g>
        </svg>
        <div class="vlabel"><span>${label}</span><b class="${cls}">${this._fmt(value)}°</b></div>
      </div>`;
    };
    const views = !c.show_views ? "" : `
      <div class="views">
        ${view(SIDE_SVG, "-15 -25 729 408", 357, p, t.pitch, pitch, this._cls(pitch), 420)}
        ${view(REAR_SVG, "-15 -25 275 392", 345, -r, t.roll, roll, this._cls(roll), 170)}
      </div>`;

    /* Libelle: Blase wandert zur höheren Seite (oben = Front, links = Fahrerseite) */
    const R = 62, k = R / c.bubble_range;
    const clamp = (v) => Math.max(-c.bubble_range, Math.min(c.bubble_range, v));
    const bx = 80 - clamp(r) * k, by = 80 - clamp(p) * k;
    const worst = Math.max(Math.abs(p), Math.abs(r));
    const bubble = !c.show_bubble ? "" : `
      <svg viewBox="0 0 160 160" class="bubble">
        <circle cx="80" cy="80" r="${R + 6}" class="vial"/>
        <circle cx="80" cy="80" r="${R * c.warn / c.bubble_range}" class="ringw"/>
        <circle cx="80" cy="80" r="${R * c.tolerance / c.bubble_range}" class="ringok"/>
        <line x1="80" y1="${80 - R}" x2="80" y2="${80 + R}" class="cross"/><line x1="${80 - R}" y1="80" x2="${80 + R}" y2="80" class="cross"/>
        <text x="80" y="${80 - R - 8}" class="bl">▲ ${t.front}</text>
        ${pitch == null || roll == null ? "" : `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="13" class="bub ${this._cls(worst)}"/>`}
      </svg>`;

    const values = !c.show_values ? "" : `
      <div class="vals">
        <div><span>${t.lengthwise}</span><b class="${this._cls(pitch)}">${this._fmt(pitch)}°</b><em>${longCm == null ? "" : this._fmt(longCm) + " cm"}</em></div>
        <div><span>${t.sideways}</span><b class="${this._cls(roll)}">${this._fmt(roll)}°</b><em>${sideCm == null ? "" : this._fmt(sideCm) + " cm"}</em></div>
        ${c.show_hint && hint ? `<div class="hint ${worst <= c.tolerance ? "ok" : ""}">${hint}</div>` : ""}
      </div>`;

    this.shadowRoot.innerHTML = `
<style>
  :host { --ok: var(--success-color, #43a047); --warn: var(--warning-color, #f59e0b); --bad: var(--error-color, #e53935); }
  ha-card { padding: 16px; container-type: inline-size; }
  .title { font-size: 1.1em; font-weight: 500; margin-bottom: 8px; color: var(--primary-text-color); }
  .views { display: flex; gap: 12px; align-items: flex-end; justify-content: center; }
  .view { display: flex; flex-direction: column; align-items: center; min-width: 0; }
  .view:first-child { flex: 2.5; } .view:last-child { flex: 1; }
  .vsvg { width: 100%; display: block; overflow: hidden; }
  .tilt { transform-box: fill-box; transform-origin: 50% 100%; transition: transform .6s cubic-bezier(.3,.7,.3,1); }
  .horizon { stroke: var(--secondary-text-color); stroke-width: 2; stroke-dasharray: 6 5; opacity: .6; }
  .vlabel { display: flex; gap: 8px; align-items: baseline; color: var(--secondary-text-color); font-size: 13px; margin-top: 4px; }
  .vlabel b { font-size: 20px; }
  .lower { display: flex; gap: 16px; align-items: center; margin-top: 12px; }
  .bubble { width: 150px; flex: none; }
  .vial { fill: var(--secondary-background-color, rgba(127,127,127,.1)); stroke: var(--divider-color, #ccc); stroke-width: 2; }
  .ringok { fill: none; stroke: var(--ok); stroke-width: 1.5; opacity: .8; }
  .ringw { fill: none; stroke: var(--warn); stroke-width: 1.5; stroke-dasharray: 3 3; opacity: .8; }
  .cross { stroke: var(--divider-color, #ccc); stroke-width: 1; }
  .bl { font-size: 9px; letter-spacing: .05em; fill: var(--secondary-text-color); text-anchor: middle; }
  .bub { stroke: rgba(0,0,0,.25); stroke-width: 1.5; transition: cx .6s, cy .6s; }
  .bub.ok { fill: var(--ok); } .bub.warn { fill: var(--warn); } .bub.bad { fill: var(--bad); }
  .vals { flex: 1; display: grid; gap: 8px; color: var(--primary-text-color); }
  .vals > div:not(.hint) { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: baseline; }
  .vals span { color: var(--secondary-text-color); font-size: 13px; }
  .vals b { font-size: 22px; font-weight: 600; } .vals em { font-style: normal; color: var(--secondary-text-color); min-width: 64px; text-align: right; }
  b.ok { color: var(--ok); } b.warn { color: var(--warn); } b.bad { color: var(--bad); }
  .hint { padding: 8px 12px; border-radius: 10px; background: var(--secondary-background-color, rgba(127,127,127,.1)); font-size: 14px; }
  .hint.ok { color: var(--ok); font-weight: 500; }
  @container (max-width: 420px) { .lower { flex-direction: column; } .vals { width: 100%; } }
  .warnmsg { color: var(--error-color, #db4437); }
</style>
<ha-card>
  ${c.title ? `<div class="title">${c.title}</div>` : ""}
  ${pitch == null || roll == null ? `<div class="warnmsg">${pitch == null ? c.pitch_entity : c.roll_entity}: ${t.unavailable}</div>` : ""}
  ${views}
  ${bubble || values ? `<div class="lower">${bubble}${values}</div>` : ""}
</ha-card>`;
  }
}

if (!customElements.get("ha-level-card")) {
  customElements.define("ha-level-card", HaLevelCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "ha-level-card", name: "HA Compass – Nivellierung",
    description: "Fahrzeugneigung mit Seiten-/Heckansicht, Libelle und Höhendifferenzen",
    preview: false, documentationURL: "https://github.com/trinler007/HA-Compass",
  });
}

if (!customElements.get("ha-compass-card-editor")) customElements.define("ha-compass-card-editor", HaCompassCardEditor);
if (!customElements.get("ha-level-card-editor")) customElements.define("ha-level-card-editor", HaLevelCardEditor);
