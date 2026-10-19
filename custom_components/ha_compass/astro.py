"""Sonnen- und Mondberechnung (Python-Port von SunCalc, BSD-2, Vladimir Agafonkin).

Azimut im Kompasssystem: 0° = Nord, 90° = Ost. Höhe in Grad, Mondhöhe inkl. Refraktion.
Genauigkeit für Anzeigezwecke ausreichend (Sonne < 0,1°, Mond ca. 0,5°).
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from math import acos, asin, atan2, cos, pi, sin, sqrt, tan

RAD = pi / 180
DAY_S = 86400
J1970 = 2440588
J2000 = 2451545
E = RAD * 23.4397
J0 = 0.0009


def _to_julian(dt: datetime) -> float:
    return dt.timestamp() / DAY_S - 0.5 + J1970


def _from_julian(j: float) -> datetime:
    return datetime.fromtimestamp((j + 0.5 - J1970) * DAY_S, tz=timezone.utc)


def _to_days(dt: datetime) -> float:
    return _to_julian(dt) - J2000


def _ra(l: float, b: float) -> float:
    return atan2(sin(l) * cos(E) - tan(b) * sin(E), cos(l))


def _dec(l: float, b: float) -> float:
    return asin(sin(b) * cos(E) + cos(b) * sin(E) * sin(l))


def _azimuth(h: float, phi: float, dec: float) -> float:
    return atan2(sin(h), cos(h) * sin(phi) - tan(dec) * cos(phi))


def _altitude(h: float, phi: float, dec: float) -> float:
    return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(h))


def _sidereal(d: float, lw: float) -> float:
    return RAD * (280.16 + 360.9856235 * d) - lw


def _refraction(h: float) -> float:
    h = max(h, 0)
    return 0.0002967 / tan(h + 0.00312536 / (h + 0.08901179))


def _solar_mean_anomaly(d: float) -> float:
    return RAD * (357.5291 + 0.98560028 * d)


def _ecliptic_longitude(m: float) -> float:
    c = RAD * (1.9148 * sin(m) + 0.02 * sin(2 * m) + 0.0003 * sin(3 * m))
    return m + c + RAD * 102.9372 + pi


def _sun_coords(d: float) -> tuple[float, float]:
    l = _ecliptic_longitude(_solar_mean_anomaly(d))
    return _dec(l, 0), _ra(l, 0)


def _compass(az: float) -> float:
    return (az / RAD + 180) % 360


def sun_position(dt: datetime, lat: float, lon: float) -> tuple[float, float]:
    """(Azimut, Höhe) der Sonne in Grad."""
    lw, phi, d = RAD * -lon, RAD * lat, _to_days(dt)
    dec, ra = _sun_coords(d)
    h = _sidereal(d, lw) - ra
    return _compass(_azimuth(h, phi, dec)), _altitude(h, phi, dec) / RAD


def sun_times(day: datetime, lat: float, lon: float) -> dict[str, datetime | None]:
    """Sonnenzeiten für den Kalendertag von `day` (lokale Mittagszeit übergeben)."""
    lw, phi = RAD * -lon, RAD * lat
    d = _to_days(day)
    n = round(d - J0 - lw / (2 * pi))
    ds = J0 + lw / (2 * pi) + n
    m = _solar_mean_anomaly(ds)
    l = _ecliptic_longitude(m)
    dec = _dec(l, 0)
    j_noon = J2000 + ds + 0.0053 * sin(m) - 0.0069 * sin(2 * l)
    out: dict[str, datetime | None] = {"noon": _from_julian(j_noon)}
    for angle, rise, sset in ((-0.833, "sunrise", "sunset"), (-6, "dawn", "dusk")):
        x = (sin(angle * RAD) - sin(phi) * sin(dec)) / (cos(phi) * cos(dec))
        if abs(x) > 1:  # Polartag / Polarnacht
            out[rise] = out[sset] = None
            continue
        w = acos(x)
        a = J0 + (w + lw) / (2 * pi) + n
        j_set = J2000 + a + 0.0053 * sin(m) - 0.0069 * sin(2 * l)
        out[sset] = _from_julian(j_set)
        out[rise] = _from_julian(j_noon - (j_set - j_noon))
    return out


def _moon_coords(d: float) -> tuple[float, float, float]:
    l = RAD * (218.316 + 13.176396 * d)
    m = RAD * (134.963 + 13.064993 * d)
    f = RAD * (93.272 + 13.229350 * d)
    lon = l + RAD * 6.289 * sin(m)
    lat = RAD * 5.128 * sin(f)
    dist = 385001 - 20905 * cos(m)
    return _ra(lon, lat), _dec(lon, lat), dist


def moon_position(dt: datetime, lat: float, lon: float) -> tuple[float, float, float]:
    """(Azimut, Höhe, Entfernung km) des Mondes."""
    lw, phi, d = RAD * -lon, RAD * lat, _to_days(dt)
    ra, dec, dist = _moon_coords(d)
    h = _sidereal(d, lw) - ra
    alt = _altitude(h, phi, dec)
    alt += _refraction(alt)
    return _compass(_azimuth(h, phi, dec)), alt / RAD, dist


def moon_illumination(dt: datetime) -> tuple[float, float]:
    """(beleuchteter Anteil 0..1, Phase 0..1; 0 = Neumond, 0.5 = Vollmond)."""
    d = _to_days(dt)
    s_dec, s_ra = _sun_coords(d)
    m_ra, m_dec, m_dist = _moon_coords(d)
    sdist = 149598000
    phi = acos(sin(s_dec) * sin(m_dec) + cos(s_dec) * cos(m_dec) * cos(s_ra - m_ra))
    inc = atan2(sdist * sin(phi), m_dist - sdist * cos(phi))
    angle = atan2(
        cos(s_dec) * sin(s_ra - m_ra),
        sin(s_dec) * cos(m_dec) - cos(s_dec) * sin(m_dec) * cos(s_ra - m_ra),
    )
    fraction = (1 + cos(inc)) / 2
    phase = 0.5 + 0.5 * inc * (-1 if angle < 0 else 1) / pi
    return fraction, phase


def moon_times(start: datetime, lat: float, lon: float) -> tuple[datetime | None, datetime | None]:
    """Mondauf- und -untergang innerhalb von 24 h ab `start` (lokaler Tagesbeginn)."""
    hc = 0.133

    def alt(hours: float) -> float:
        return moon_position(start + timedelta(hours=hours), lat, lon)[1] - hc

    h0 = alt(0)
    rise = sset = None
    for i in range(1, 24, 2):
        h1, h2 = alt(i), alt(i + 1)
        a = (h0 + h2) / 2 - h1
        b = (h2 - h0) / 2
        if a == 0:
            h0 = h2
            continue
        xe = -b / (2 * a)
        ye = (a * xe + b) * xe + h1
        disc = b * b - 4 * a * h1
        roots, x1, x2 = 0, 0.0, 0.0
        if disc >= 0:
            dx = sqrt(disc) / (abs(a) * 2)
            x1, x2 = xe - dx, xe + dx
            if abs(x1) <= 1:
                roots += 1
            if abs(x2) <= 1:
                roots += 1
            if x1 < -1:
                x1 = x2
        if roots == 1:
            if h0 < 0:
                rise = i + x1
            else:
                sset = i + x1
        elif roots == 2:
            rise = i + (x2 if ye < 0 else x1)
            sset = i + (x1 if ye < 0 else x2)
        if rise is not None and sset is not None:
            break
        h0 = h2
    to_dt = lambda h: None if h is None else start + timedelta(hours=h)  # noqa: E731
    return to_dt(rise), to_dt(sset)


PHASES = (
    (0.0335, "neumond"),
    (0.2165, "zunehmende_sichel"),
    (0.2835, "erstes_viertel"),
    (0.4665, "zunehmender_mond"),
    (0.5335, "vollmond"),
    (0.7165, "abnehmender_mond"),
    (0.7835, "letztes_viertel"),
    (0.9665, "abnehmende_sichel"),
    (1.0001, "neumond"),
)


def phase_name(phase: float) -> str:
    for limit, name in PHASES:
        if phase < limit:
            return name
    return "neumond"


def relative_bearing(target_az: float, heading: float) -> float:
    """Winkel des Ziels relativ zum Bug, -180..180, + = rechts."""
    return (target_az - heading + 540) % 360 - 180


def shade_side(rel: float, elevation: float) -> str:
    """Beschattete Fahrzeugseite für einen Sonnenwinkel relativ zum Bug."""
    if elevation <= 0:
        return "keine"
    if abs(rel) <= 45:
        return "heck"
    if abs(rel) >= 135:
        return "front"
    return "links" if rel > 0 else "rechts"
