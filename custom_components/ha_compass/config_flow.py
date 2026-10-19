"""Konfiguration für HA Compass."""
from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import CONF_HEADING, DEFAULT_HEADING, DOMAIN


def _schema(default: str) -> vol.Schema:
    return vol.Schema({
        vol.Required(CONF_HEADING, default=default): selector.EntitySelector(
            selector.EntitySelectorConfig(domain="sensor")
        ),
    })


class CompassConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None):
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            return self.async_create_entry(title="HA Compass", data=user_input)
        return self.async_show_form(step_id="user", data_schema=_schema(DEFAULT_HEADING))

    @staticmethod
    @callback
    def async_get_options_flow(entry: ConfigEntry) -> OptionsFlow:
        return CompassOptionsFlow()


class CompassOptionsFlow(OptionsFlow):
    async def async_step_init(self, user_input: dict[str, Any] | None = None):
        if user_input is not None:
            return self.async_create_entry(data=user_input)
        current = self.config_entry.options.get(
            CONF_HEADING, self.config_entry.data.get(CONF_HEADING, DEFAULT_HEADING)
        )
        return self.async_show_form(step_id="init", data_schema=_schema(current))
