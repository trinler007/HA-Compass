"""Erzeugt die openHASP-Seite (pages.jsonl-Ausschnitt + openHASP-Integration YAML) und eine HTML-Vorschau.

Aufruf:  python3 generate.py [PLATTENNAME] [SEITE]
"""
import json
import math
import sys

PLATE = sys.argv[1] if len(sys.argv) > 1 else "terminal01"
P = int(sys.argv[2]) if len(sys.argv) > 2 else 9

HEADING = "sensor.camper_kompass_ausrichtung_geografisch"
VIEW = "select.ha_compass_ansicht"
CX, CY = 177, 237          # Kompassmitte
R_TICK, R_LBL, R_SUN = 145, 108, 160
VEH_ZOOM = 232            # 256 = 100 %; Fahrzeug ~178 px lang
BG, CARD, FG, SUB, AMBER, MOON = "#2C3E50", "#1F2A36", "#FFFFFF", "#B7C9D8", "#F59E0B", "#CBD5E1"


def mdi(cp: int) -> str:
    return chr(cp)


SUN, RISE, SET, NIGHT = mdi(0xF0599), mdi(0xF059C), mdi(0xF059B), mdi(0xF0594)

# ---------------------------------------------------------------- Jinja-Bausteine
J_H = f"{{% set h = states('{HEADING}')|float(0) %}}"
J_ROT = J_H + f"{{% set rot = 0 if is_state('{VIEW}','fahrzeug_dreht') else -h %}}"


def j_xy(az_expr: str, r: int, size: int, axis: str) -> str:
    fn = "sin" if axis == "x" else "cos"
    c, sign = (CX, "+") if axis == "x" else (CY, "-")
    return J_ROT + f"{{{{ ({c} {sign} {r}*{fn}(({az_expr}+rot)*pi/180) - {size // 2})|round|int }}}}"


def j_lv(az_expr: str) -> str:
    """Kompass-Azimut -> LVGL-Winkel (0° = 3 Uhr, im Uhrzeigersinn)."""
    return J_ROT + f"{{{{ ((({az_expr})+rot-90) % 360)|round|int }}}}"


SUN_AZ = "states('sensor.ha_compass_sonne_azimut')|float(0)"
SUN_EL = "states('sensor.ha_compass_sonne_hoehe')|float(-90)"
RISE_AZ = "state_attr('sensor.ha_compass_sonnenaufgang','azimut')|float(90)"
SET_AZ = "state_attr('sensor.ha_compass_sonnenuntergang','azimut')|float(270)"
MOON_AZ = "states('sensor.ha_compass_mond_azimut')|float(0)"
MOON_EL = "states('sensor.ha_compass_mond_hoehe')|float(-90)"

# ---------------------------------------------------------------- Objekte
jsonl, yaml_objs = [], []


def obj(id_, **kw):
    jsonl.append({"page": P, "id": id_, **kw})


def bind(id_, props=None, event=None):
    yaml_objs.append((f"p{P}b{id_}", props or {}, event))


jsonl.append({"page": P, "id": 0, "prev": 6, "next": 1, "bg_color": BG})
obj(1, obj="img", src="L:/terminal01-bg.png", auto_size=1, h=480, w=480, zoom=256, x=0, y=0, swipe=1, to_back=1)

# Dunkler Hintergrundkreis für Sonnenbahn und Marker (liegt hinter allem)
R_BG = 168
obj(6, obj="obj", x=CX - R_BG, y=CY - R_BG, w=2 * R_BG, h=2 * R_BG, radius=R_BG,
    bg_color="#141A21", bg_opa=255, border_width=0, click=0)

# Scheibe + Skala
obj(2, obj="obj", x=CX - R_TICK, y=CY - R_TICK, w=2 * R_TICK, h=2 * R_TICK, radius=R_TICK,
    bg_color=CARD, border_width=2, border_color="#3C5268", click=0)
# Skala ganz außen: 72 Feinstriche (5°) + 4 lange Hauptstriche (N/O/S/W), drehen im Modus „Ring dreht“ mit
obj(3, obj="linemeter", x=CX - R_TICK, y=CY - R_TICK, w=2 * R_TICK, h=2 * R_TICK,
    angle=360, line_count=73, min=0, max=100, val=100, scale_width=9, line_width=2,
    line_color=SUB, scale_end_color=SUB, scale_grad_color=SUB, scale_end_line_width=2,
    bg_opa=0, border_width=0, pad_top=0, pad_bottom=0, pad_left=0, pad_right=0, click=0)
bind(3, {"rotation": J_ROT + "{{ (rot % 360)|round|int }}"})
obj(5, obj="linemeter", x=CX - R_TICK, y=CY - R_TICK, w=2 * R_TICK, h=2 * R_TICK,
    angle=360, line_count=5, min=0, max=100, val=100, scale_width=20, line_width=4,
    line_color=FG, scale_end_color=FG, scale_grad_color=FG, scale_end_line_width=4,
    bg_opa=0, border_width=0, pad_top=0, pad_bottom=0, pad_left=0, pad_right=0, click=0)
bind(5, {"rotation": J_ROT + "{{ (rot % 360)|round|int }}"})

# Sonnenbahn (Hintergrund = Tagesbogen, Indikator = bisheriger Verlauf)
obj(4, obj="arc", x=CX - R_SUN, y=CY - R_SUN, w=2 * R_SUN, h=2 * R_SUN, start_angle=14, end_angle=166,
    start_angle10=14, end_angle10=100, line_width=6, line_color=AMBER, line_opa=90, line_rounded=1,
    line_width10=6, line_color10=AMBER, line_rounded10=1, bg_opa=0, border_width=0,
    pad_top=0, pad_bottom=0, pad_left=0, pad_right=0, bg_opa20=0, pad_top20=0, pad_bottom20=0,
    pad_left20=0, pad_right20=0, click=0)
day_lv_start = j_lv(RISE_AZ)
bind(4, {
    "start_angle": day_lv_start,
    "end_angle": j_lv(SET_AZ),
    "start_angle10": day_lv_start,
    "end_angle10": J_ROT + f"{{% set e = {SUN_EL} %}}{{{{ (((({SUN_AZ}) if e > 0 else ({RISE_AZ}))+rot-90) % 360)|round|int }}}}",
})

# Himmelsrichtungen
for i, (az, t) in enumerate(((0, "N"), (90, "O"), (180, "S"), (270, "W"))):
    oid = 10 + i
    a = math.radians(az)
    obj(oid, obj="label", x=round(CX + R_LBL * math.sin(a) - 13), y=round(CY - R_LBL * math.cos(a) - 13),
        w=26, h=26, text=t, align=1, text_font=25, text_color="#EF4444" if t == "N" else FG, bg_opa=0, click=0)
    bind(oid, {"x": j_xy(str(az), R_LBL, 26, "x"), "y": j_xy(str(az), R_LBL, 26, "y")})

# Fahrzeug
obj(20, obj="img", src="L:/nx01.png", x=CX - 98, y=CY - 98, w=196, h=196, zoom=VEH_ZOOM, angle=0, click=0)
bind(20, {"angle": J_H + f"{{{{ (h*10)|round|int if is_state('{VIEW}','fahrzeug_dreht') else 0 }}}}"})

# Bug-Markierung im Modus „Ring dreht“
obj(21, obj="label", x=CX - 10, y=CY - R_SUN - 20, w=20, h=16, text="\u25BC", align=1, text_font=16,
    text_color=FG, bg_opa=0, hidden=1, click=0)
bind(21, {"hidden": f"{{{{ 1 if is_state('{VIEW}','fahrzeug_dreht') else 0 }}}}"})

# Sonne und Mond
obj(22, obj="obj", x=0, y=0, w=20, h=20, radius=10, bg_color="#FBBF24", border_width=3, border_color=BG, click=0)
bind(22, {"x": j_xy(SUN_AZ, R_SUN, 20, "x"), "y": j_xy(SUN_AZ, R_SUN, 20, "y"),
          "hidden": f"{{{{ 1 if {SUN_EL} <= 0 else 0 }}}}"})
obj(23, obj="obj", x=0, y=0, w=16, h=16, radius=8, bg_color=MOON, border_width=3, border_color=BG, click=0)
bind(23, {"x": j_xy(MOON_AZ, R_SUN, 16, "x"), "y": j_xy(MOON_AZ, R_SUN, 16, "y"),
          "hidden": f"{{{{ 1 if {MOON_EL} <= 0 else 0 }}}}"})

# Infospalte rechts
X = 351
def lbl(oid, y, text, font=20, color=FG, w=120, x=X, align=0):
    obj(oid, obj="label", x=x, y=y, w=w, h=font + 8, text=text, align=align, text_font=font,
        text_color=color, bg_opa=0, click=0)

lbl(30, 70, "Ausrichtung", 16, SUB)
lbl(31, 90, "---°", 30)
bind(31, {"text": J_H + "{{ '%d°' % (h|round|int % 360) }}"})
lbl(32, 124, "--", 25, SUB)
bind(32, {"text": J_H + "{{ ['N','NNO','NO','ONO','O','OSO','SO','SSO','S','SSW','SW','WSW','W','WNW','NW','NNW'][((h+11.25)/22.5)|int % 16] }}"})

def icon(oid, y, glyph, color):
    obj(oid, obj="label", x=X, y=y, w=24, h=24, text=glyph, align=0, text_font="mdi20",
        text_color=color, bg_opa=0, click=0)

icon(33, 168, SUN, "#FBBF24");   lbl(34, 166, "---° --°", 20, x=X + 26, w=96)
bind(34, {"text": f"{{{{ '%d° %d°' % ({SUN_AZ}|round|int, {SUN_EL}|round|int) }}}}"})
icon(35, 196, RISE, SUB);        lbl(36, 194, "--:--", 20, x=X + 26, w=96)
bind(36, {"text": "{{ as_timestamp(states('sensor.ha_compass_sonnenaufgang'), 0)|timestamp_custom('%H:%M') if has_value('sensor.ha_compass_sonnenaufgang') else '--:--' }}"})
icon(37, 222, SET, SUB);         lbl(38, 220, "--:--", 20, x=X + 26, w=96)
bind(38, {"text": "{{ as_timestamp(states('sensor.ha_compass_sonnenuntergang'), 0)|timestamp_custom('%H:%M') if has_value('sensor.ha_compass_sonnenuntergang') else '--:--' }}"})
icon(39, 256, NIGHT, MOON);      lbl(40, 254, "---° --%", 20, x=X + 26, w=96)
bind(40, {"text": f"{{{{ '%d° %d%%' % ({MOON_AZ}|round|int, states('sensor.ha_compass_mond_beleuchtung')|float(0)|round|int) }}}}"})

lbl(41, 292, "Schatten", 16, SUB)
lbl(42, 310, "--", 20)
bind(42, {"text": "{{ {'links':'Fahrerseite','rechts':'Beifahrerseite','front':'Front','heck':'Heck','keine':'Nacht'}.get(states('sensor.ha_compass_schattenseite'), '--') }}"})
lbl(43, 336, "", 16, SUB)
bind(43, {"text": "{% set r = states('sensor.ha_compass_sonne_relativ')|float(0) %}"
                  "{{ ('Sonne %d° ' % (r|abs|round|int)) ~ ('rechts' if r > 0 else 'links') if has_value('sensor.ha_compass_sonne_relativ') else '' }}"})

# Umschalter Ansicht
obj(44, obj="btn", x=X - 4, y=366, w=124, h=40, text="Ansicht", text_font=18, text_color=FG,
    bg_color="#3C5268", radius=10, border_side=0, toggle=False)
bind(44, {"text": f"{{{{ 'Fahrzeug dreht' if is_state('{VIEW}','fahrzeug_dreht') else 'Ring dreht' }}}}"},
     {"up": [{"action": "select.select_next", "target": {"entity_id": VIEW}, "data": {"cycle": True}}]})

# ---------------------------------------------------------------- Ausgabe
with open("page.jsonl", "w", encoding="utf-8") as f:
    f.write(f"// Seite {P}: Kompass (HA Compass)\n")
    for o in jsonl:
        f.write(json.dumps(o, ensure_ascii=True) + "\n")


def yq(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


lines = ["# In configuration.yaml unter der vorhandenen openHASP-Platte ergänzen:",
         "openhasp:", f"  {PLATE}:", "    objects:"]
for name, props, event in yaml_objs:
    lines.append(f'      - obj: "{name}"')
    if props:
        lines.append("        properties:")
        for k, v in props.items():
            lines.append(f'          "{k}": {yq(v)}')
    if event:
        lines.append("        event:")
        for ev, actions in event.items():
            lines.append(f'          "{ev}":')
            for a in actions:
                lines.append(f"            - action: {a['action']}")
                lines.append(f"              target:")
                lines.append(f"                entity_id: {a['target']['entity_id']}")
                lines.append(f"              data:")
                for dk, dv in a["data"].items():
                    lines.append(f"                {dk}: {str(dv).lower()}")
open("openhasp-ha-compass.yaml", "w", encoding="utf-8").write("\n".join(lines) + "\n")
print(len(jsonl), "Objekte,", len(yaml_objs), "Bindungen")
