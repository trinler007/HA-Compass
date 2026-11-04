"""Einfaches PV-Modell: Einfallswinkel, Klarhimmel-Einstrahlung, Leistung, Optimierung.

Koordinaten: Ost, Nord, Oben. Azimut wie beim Kompass (0° = Nord, 90° = Ost).
Fahrzeuglage: Nicken + = Front höher, Rollen + = Fahrerseite (links) höher.
"""
from __future__ import annotations

from collections.abc import Callable, Iterable
from datetime import datetime, timedelta
from math import acos, atan2, cos, degrees, exp, radians, sin, sqrt

SOLAR_CONST = 1353.0      # W/m² (Meinel)
ALBEDO = 0.2
TEMP_COEFF = -0.004       # 1/K (monokristallin)
NOCT_ROOF = 45.0          # °C – hinterlüftet ca. 10 cm über dem Dach
NOCT_MOBILE = 47.0        # °C – Solartasche frei aufgestellt

Vec = tuple[float, float, float]


def sun_vector(az: float, el: float) -> Vec:
    a, e = radians(az), radians(el)
    return (cos(e) * sin(a), cos(e) * cos(a), sin(e))


def plane_normal(tilt: float, az: float) -> Vec:
    """Normale einer Fläche mit Neigung `tilt` (0 = waagerecht), die nach `az` geneigt ist."""
    t, a = radians(tilt), radians(az)
    return (sin(t) * sin(a), sin(t) * cos(a), cos(t))


def roof_normal(heading: float | None, pitch: float | None, roll: float | None) -> Vec:
    """Dachnormale aus Fahrzeugausrichtung und -lage (Module parallel zum Dach)."""
    if heading is None or pitch is None or roll is None:
        return (0.0, 0.0, 1.0)
    h = radians(heading)
    fwd = (sin(h), cos(h), 0.0)
    left = (-cos(h), sin(h), 0.0)
    tp, tr = -_tan(pitch), -_tan(roll)  # Front hoch -> Normale kippt nach hinten
    n = (tp * fwd[0] + tr * left[0], tp * fwd[1] + tr * left[1], 1.0)
    length = sqrt(n[0] ** 2 + n[1] ** 2 + n[2] ** 2)
    return (n[0] / length, n[1] / length, n[2] / length)


def normal_tilt_az(n: Vec) -> tuple[float, float]:
    tilt = degrees(acos(max(-1.0, min(1.0, n[2]))))
    az = degrees(atan2(n[0], n[1])) % 360 if tilt > 1e-6 else 0.0
    return tilt, az


def _tan(deg: float) -> float:
    return sin(radians(deg)) / cos(radians(deg))


def dot(a: Vec, b: Vec) -> float:
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def clear_sky(el: float) -> tuple[float, float, float]:
    """(DNI, DHI, GHI) in W/m² bei klarem Himmel (Meinel/Kasten-Young + Haurwitz)."""
    if el <= 0.0:
        return 0.0, 0.0, 0.0
    s = sin(radians(el))
    am = 1.0 / (s + 0.50572 * (el + 6.07995) ** -1.6364)
    dni = SOLAR_CONST * 0.7 ** (am ** 0.678)
    ghi = 1098.0 * s * exp(-0.057 / s)
    dhi = max(ghi - dni * s, 0.0)
    return dni, dhi, max(ghi, dni * s)


def poa(n: Vec, sun: Vec, el: float) -> float:
    """Einstrahlung auf die Modulebene in W/m² (direkt + isotrop diffus + Boden)."""
    dni, dhi, ghi = clear_sky(el)
    if ghi <= 0.0:
        return 0.0
    cos_t = n[2]
    return dni * max(dot(n, sun), 0.0) + dhi * (1 + cos_t) / 2 + ghi * ALBEDO * (1 - cos_t) / 2


def cloud_factor(coverage_pct: float | None) -> float | None:
    """Kasten-Czeplak: G = Gklar · (1 − 0,75 · N^3,4)."""
    if coverage_pct is None:
        return None
    n = max(0.0, min(1.0, coverage_pct / 100.0))
    return 1.0 - 0.75 * n ** 3.4


def power(wp: float, irr: float, t_amb: float | None, noct: float, system: float) -> float:
    """Erwartete DC-Leistung in W."""
    if irr <= 0.0 or wp <= 0.0:
        return 0.0
    t_cell = (t_amb if t_amb is not None else 15.0) + (noct - 20.0) / 800.0 * irr
    return max(wp * irr / 1000.0 * (1 + TEMP_COEFF * (t_cell - 25.0)) * system, 0.0)


def incidence(n: Vec, sun: Vec) -> float:
    return degrees(acos(max(-1.0, min(1.0, dot(n, sun)))))


def energy(
    n: Vec, steps: Iterable[tuple[Vec, float]], wp: float, t_amb: float | None, noct: float,
    system: float, step_h: float,
) -> float:
    """Energie in kWh über die gegebenen (Sonnenvektor, Höhe)-Schritte."""
    return sum(power(wp, poa(n, s, el), t_amb, noct, system) for s, el in steps) * step_h / 1000.0


def sun_steps(
    start: datetime, end: datetime, sun_pos: Callable[[datetime], tuple[float, float]], minutes: int = 10,
) -> list[tuple[Vec, float]]:
    """Sonnenvektoren zwischen start und end (nur über dem Horizont)."""
    out, t = [], start
    while t < end:
        az, el = sun_pos(t)
        if el > 0:
            out.append((sun_vector(az, el), el))
        t += timedelta(minutes=minutes)
    return out


def best_fixed(
    steps: list[tuple[Vec, float]], wp: float, t_amb: float | None, system: float, step_h: float,
) -> tuple[float, float, float]:
    """Beste feste Aufstellung (Neigung, Azimut, kWh) für die gegebenen Schritte – Raster 5°."""
    best = (0.0, 180.0, energy((0.0, 0.0, 1.0), steps, wp, t_amb, NOCT_MOBILE, system, step_h))
    if not steps:
        return best
    for tilt in range(5, 91, 5):
        for az in range(0, 360, 5):
            e = energy(plane_normal(tilt, az), steps, wp, t_amb, NOCT_MOBILE, system, step_h)
            if e > best[2]:
                best = (float(tilt), float(az), e)
    # Feinsuche ±4° um das Rasteroptimum
    t0, a0, _ = best
    for tilt in range(max(0, int(t0) - 4), min(90, int(t0) + 4) + 1):
        for az in range(int(a0) - 4, int(a0) + 5):
            e = energy(plane_normal(tilt, az % 360), steps, wp, t_amb, NOCT_MOBILE, system, step_h)
            if e > best[2]:
                best = (float(tilt), float(az % 360), e)
    return best
