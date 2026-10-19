"""Berechnet Sonne und Mond für die aktuelle HA-Position."""
from __future__ import annotations

from datetime import timedelta
import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from . import astro
from .const import DOMAIN, UPDATE_SECONDS

_LOGGER = logging.getLogger(__name__)


class CompassCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Rechnet minütlich. Die Position folgt der HA-Heimatposition (wird im Fahrzeug per GPS nachgeführt)."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        super().__init__(
            hass, _LOGGER, name=DOMAIN, config_entry=entry,
            update_interval=timedelta(seconds=UPDATE_SECONDS),
        )

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
        }
