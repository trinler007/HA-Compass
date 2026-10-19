"""Ansichtsmodus des Kompasses (gilt für Karte und openHASP)."""
from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from .const import VIEW_OPTIONS, VIEW_VEHICLE
from .entity import device_info


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    async_add_entities([ViewSelect()])


class ViewSelect(SelectEntity, RestoreEntity):
    _attr_has_entity_name = True
    _attr_translation_key = "ansicht"
    _attr_unique_id = "ha_compass_ansicht"
    _attr_icon = "mdi:rotate-3d-variant"
    _attr_options = VIEW_OPTIONS
    _attr_current_option = VIEW_VEHICLE

    def __init__(self) -> None:
        self.entity_id = "select.ha_compass_ansicht"
        self._attr_device_info = device_info()

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last = await self.async_get_last_state()
        if last and last.state in VIEW_OPTIONS:
            self._attr_current_option = last.state

    async def async_select_option(self, option: str) -> None:
        self._attr_current_option = option
        self.async_write_ha_state()
