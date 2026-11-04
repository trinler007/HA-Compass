"""Konfiguration für HA Compass."""
from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import (
    CONF_HEADING, CONF_MOBILE_POWER, CONF_MOBILE_WP, CONF_PITCH, CONF_ROLL, CONF_ROOF_POWER,
    CONF_ROOF_WP, CONF_SYSTEM, CONF_TEMPERATURE, CONF_WEATHER, DEFAULTS, DOMAIN,
)


def _entity(domain: str | list[str]) -> selector.EntitySelector:
    return selector.EntitySelector(selector.EntitySelectorConfig(domain=domain))


def _number(lo: float, hi: float, step: float, unit: str) -> selector.NumberSelector:
    return selector.NumberSelector(selector.NumberSelectorConfig(
        min=lo, max=hi, step=step, unit_of_measurement=unit, mode=selector.NumberSelectorMode.BOX))


def _schema(cur: dict[str, Any]) -> vol.Schema:
    def opt(key: str):
        # Optionale Entitäten: vorausgefüllt, aber leer lassbar
        value = cur.get(key)
        return vol.Optional(key, description={"suggested_value": value} if value else None)

    return vol.Schema({
        vol.Required(CONF_HEADING, default=cur.get(CONF_HEADING, DEFAULTS[CONF_HEADING])): _entity("sensor"),
        opt(CONF_PITCH): _entity("sensor"),
        opt(CONF_ROLL): _entity("sensor"),
        vol.Required(CONF_ROOF_WP, default=cur.get(CONF_ROOF_WP, DEFAULTS[CONF_ROOF_WP])): _number(0, 10000, 10, "Wp"),
        opt(CONF_ROOF_POWER): _entity("sensor"),
        vol.Required(CONF_MOBILE_WP, default=cur.get(CONF_MOBILE_WP, DEFAULTS[CONF_MOBILE_WP])): _number(0, 10000, 10, "Wp"),
        opt(CONF_MOBILE_POWER): _entity("sensor"),
        opt(CONF_TEMPERATURE): _entity("sensor"),
        opt(CONF_WEATHER): _entity("weather"),
        vol.Required(CONF_SYSTEM, default=cur.get(CONF_SYSTEM, DEFAULTS[CONF_SYSTEM])): _number(50, 100, 1, "%"),
    })


def current(entry: ConfigEntry) -> dict[str, Any]:
    """Wirksame Konfiguration: Startwerte < Einrichtung < Optionen."""
    if CONF_ROOF_WP in entry.options:
        # Mit dem aktuellen Formular gespeichert: leer gelassene optionale Felder bleiben leer
        required = {k: DEFAULTS[k] for k in (CONF_HEADING, CONF_ROOF_WP, CONF_MOBILE_WP, CONF_SYSTEM)}
        return {**required, **entry.data, **entry.options}
    # Ältere Einrichtung (nur Ausrichtung): Solar-Startwerte ergänzen
    return {**DEFAULTS, **entry.data, **entry.options}


class CompassConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None):
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            return self.async_create_entry(title="HA Compass", data={}, options=user_input)
        return self.async_show_form(step_id="user", data_schema=_schema(DEFAULTS))

    @staticmethod
    @callback
    def async_get_options_flow(entry: ConfigEntry) -> OptionsFlow:
        return CompassOptionsFlow()


class CompassOptionsFlow(OptionsFlow):
    async def async_step_init(self, user_input: dict[str, Any] | None = None):
        if user_input is not None:
            return self.async_create_entry(data=user_input)
        return self.async_show_form(step_id="init", data_schema=_schema(current(self.config_entry)))
