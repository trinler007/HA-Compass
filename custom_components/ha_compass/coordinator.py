"""Berechnet Sonne und Mond für die aktuelle HA-Position."""
from __future__ import annotations

from datetime import timedelta
import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN

from . import astro, solar
from .config_flow import current
from .const import (
    CONF_HEADING, CONF_MOBILE_POWER, CONF_MOBILE_WP, CONF_PITCH, CONF_ROLL, CONF_ROOF_POWER,
    CONF_ROOF_WP, CONF_SYSTEM, CONF_TEMPERATURE, CONF_WEATHER, DOMAIN, UPDATE_SECONDS,
)

MOBILE_EVERY = timedelta(minutes=10)
STEP_MIN = 10

_LOGGER = logging.getLogger(__name__)


class CompassCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Rechnet minütlich. Die Position folgt der HA-Heimatposition (wird im Fahrzeug per GPS nachgeführt)."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        super().__init__(
            hass, _LOGGER, name=DOMAIN, config_entry=entry,
            update_interval=timedelta(seconds=UPDATE_SECONDS),
        )
        self.cfg = current(entry)
        self._mobile: dict[str, Any] = {}
        self._mobile_at = None
        self._day_cache: tuple[Any, list] | None = None
        self._day_times: list = []

    def _num(self, key: str) -> float | None:
        entity = self.cfg.get(key)
        state = self.hass.states.get(entity) if entity else None
        if state is None or state.state in (STATE_UNKNOWN, STATE_UNAVAILABLE):
            return None
        try:
            return float(state.state)
        except ValueError:
            return None

    def _cloud(self) -> float | None:
        entity = self.cfg.get(CONF_WEATHER)
        state = self.hass.states.get(entity) if entity else None
        if state is None or state.state in (STATE_UNKNOWN, STATE_UNAVAILABLE):
            return None
        value = state.attributes.get("cloud_coverage")
        try:
            return None if value is None else float(value)
        except (TypeError, ValueError):
            return None

    async def _async_update_data(self) -> dict[str, Any]:
        lat, lon = self.hass.config.latitude, self.hass.config.longitude
        now = dt_util.now()
        noon = now.replace(hour=12, minute=0, second=0, microsecond=0)
        midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)

        sun_az, sun_el = astro.sun_position(now, lat, lon)
        times = astro.sun_times(noon, lat, lon)
        moon_az, moon_el, moon_dist = astro.moon_position(now, lat, lon)
        fraction, phase = astro.moon_illumination(now)
        moon_rise, moon_set = astro.moon_times(midnight, lat, lon)

        data_solar = await self._solar(now, lat, lon, sun_az, sun_el)

        def az_at(t):
            return None if t is None else round(astro.sun_position(t, lat, lon)[0], 1)

        return {
            "lat": lat,
            "lon": lon,
            "sun_azimuth": round(sun_az, 1),
            "sun_elevation": round(sun_el, 1),
            "dawn": times["dawn"],
            "sunrise": times["sunrise"],
            "noon": times["noon"],
            "sunset": times["sunset"],
            "dusk": times["dusk"],
            "sunrise_azimuth": az_at(times["sunrise"]),
            "sunset_azimuth": az_at(times["sunset"]),
            "noon_elevation": None if times["noon"] is None else round(astro.sun_position(times["noon"], lat, lon)[1], 1),
            "moon_azimuth": round(moon_az, 1),
            "moon_elevation": round(moon_el, 1),
            "moon_distance": round(moon_dist),
            "moon_illumination": round(fraction * 100),
            "moon_phase_value": round(phase, 3),
            "moon_phase": astro.phase_name(phase),
            "moonrise": moon_rise,
            "moonset": moon_set,
            **data_solar,
        }

    async def _solar(self, now, lat, lon, sun_az, sun_el) -> dict[str, Any]:
        """Dach (Lage folgt dem Fahrzeug) und Solartaschen (beste Aufstellung)."""
        sys_f = float(self.cfg.get(CONF_SYSTEM) or 85) / 100.0
        roof_wp = float(self.cfg.get(CONF_ROOF_WP) or 0)
        mob_wp = float(self.cfg.get(CONF_MOBILE_WP) or 0)
        heading, pitch, roll = self._num(CONF_HEADING), self._num(CONF_PITCH), self._num(CONF_ROLL)
        t_amb, cloud = self._num(CONF_TEMPERATURE), self._cloud()
        cf = solar.cloud_factor(cloud)
        sun = solar.sun_vector(sun_az, sun_el)
        flat = (0.0, 0.0, 1.0)

        # --- Dach
        n = solar.roof_normal(heading, pitch, roll)
        tilt, tilt_az = solar.normal_tilt_az(n)
        irr, irr_flat = solar.poa(n, sun, sun_el), solar.poa(flat, sun, sun_el)
        exp_roof = solar.power(roof_wp, irr, t_amb, solar.NOCT_ROOF, sys_f)
        act_roof = self._num(CONF_ROOF_POWER)
        day0 = now.replace(hour=0, minute=0, second=0, microsecond=0)
        steps_day = await self._day_steps(day0, lat, lon)
        steps_rest = [st for st, t in zip(steps_day, self._day_times) if t >= now]
        step_h = STEP_MIN / 60.0
        out: dict[str, Any] = {
            "t_amb": t_amb,
            "cloud": cloud,
            "roof_tilt": round(tilt, 1),
            "roof_tilt_az": round(tilt_az) if tilt > 0.05 else None,
            "roof_incidence": round(solar.incidence(n, sun), 1) if sun_el > 0 else None,
            "roof_poa": round(irr),
            "roof_expected": round(exp_roof),
            "roof_expected_weather": None if cf is None else round(exp_roof * cf),
            "roof_gain": round((irr / irr_flat - 1) * 100, 1) if irr_flat > 20 else None,
            "roof_day_kwh": round(solar.energy(n, steps_day, roof_wp, t_amb, solar.NOCT_ROOF, sys_f, step_h), 2),
            "roof_rest_kwh": round(solar.energy(n, steps_rest, roof_wp, t_amb, solar.NOCT_ROOF, sys_f, step_h), 2),
            "roof_actual": act_roof,
            "roof_pr": round(act_roof / exp_roof * 100) if act_roof is not None and exp_roof > 0.02 * roof_wp else None,
        }

        # --- Solartaschen: jetzt optimal (zur Sonne) und beste feste Aufstellung für den Rest des Tages
        if sun_el > 0:
            n_opt = solar.plane_normal(90 - sun_el, sun_az)
            exp_opt = solar.power(mob_wp, solar.poa(n_opt, sun, sun_el), t_amb, solar.NOCT_MOBILE, sys_f)
        else:
            exp_opt = 0.0
        act_mob = self._num(CONF_MOBILE_POWER)
        if self._mobile_at is None or now - self._mobile_at >= MOBILE_EVERY:
            target, steps = "heute", steps_rest
            if not steps:
                target = "morgen"
                steps = await self._day_steps(day0 + timedelta(days=1), lat, lon, cache=False)
            tilt_b, az_b, kwh = await self.hass.async_add_executor_job(
                solar.best_fixed, steps, mob_wp, t_amb, sys_f, step_h)
            kwh_flat = solar.energy(flat, steps, mob_wp, t_amb, solar.NOCT_MOBILE, sys_f, step_h)
            self._mobile = {"tilt": tilt_b, "az": az_b, "kwh": round(kwh, 2), "kwh_flat": round(kwh_flat, 2), "for": target}
            self._mobile_at = now
        m = self._mobile
        out.update({
            "mobile_opt_tilt": round(90 - sun_el) if sun_el > 0 else None,
            "mobile_opt_az": round(sun_az) if sun_el > 0 else None,
            "mobile_expected": round(exp_opt),
            "mobile_expected_weather": None if cf is None else round(exp_opt * cf),
            "mobile_fix_tilt": m.get("tilt"),
            "mobile_fix_az": m.get("az"),
            "mobile_fix_rel": None if heading is None or m.get("az") is None else round(astro.relative_bearing(m["az"], heading)),
            "mobile_fix_kwh": m.get("kwh"),
            "mobile_flat_kwh": m.get("kwh_flat"),
            "mobile_fix_for": m.get("for"),
            "mobile_actual": act_mob,
            "mobile_pr": round(act_mob / exp_opt * 100) if act_mob is not None and exp_opt > 0.02 * mob_wp else None,
        })
        return out

    async def _day_steps(self, day0, lat, lon, cache: bool = True):
        """Sonnenvektoren des Tages in 10-min-Schritten (Zwischenspeicher je Tag und Ort)."""
        key = (day0.date(), round(lat, 2), round(lon, 2))
        if cache and self._day_cache is not None and self._day_cache[0] == key:
            return self._day_cache[1]
        times = [day0 + timedelta(minutes=i * STEP_MIN) for i in range(24 * 60 // STEP_MIN)]
        steps, kept = [], []
        for t in times:
            az, el = astro.sun_position(t, lat, lon)
            if el > 0:
                steps.append((solar.sun_vector(az, el), el))
                kept.append(t)
        if cache:
            self._day_cache = (key, steps)
            self._day_times = kept
        return steps
