"""HA Compass – Sonne, Mond und Fahrzeugausrichtung."""
from __future__ import annotations

from pathlib import Path

import logging

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED, Platform
from homeassistant.core import CoreState, Event, HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

from .const import DOMAIN
from .coordinator import CompassCoordinator

PLATFORMS = [Platform.SENSOR, Platform.SELECT]
CARD_URL = f"/{DOMAIN}/ha-compass-card.js"
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Lovelace-Karte bereitstellen und als Dashboard-Ressource eintragen."""
    integration = await async_get_integration(hass, DOMAIN)
    url = f"{CARD_URL}?v={integration.version}"
    path = Path(__file__).parent / "www" / "ha-compass-card.js"
    await hass.http.async_register_static_paths([StaticPathConfig(CARD_URL, str(path), False)])

    async def _register(_event: Event | None = None) -> None:
        if not await _async_register_resource(hass, url):
            # YAML-Modus der Dashboards: als globales Frontend-Modul laden
            add_extra_js_url(hass, url)

    if hass.state is CoreState.running:
        await _register()
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _register)
    return True


async def _async_register_resource(hass: HomeAssistant, url: str) -> bool:
    """Trägt die Karte in die Lovelace-Ressourcen ein bzw. aktualisiert die Version."""
    lovelace = hass.data.get("lovelace")
    resources = getattr(lovelace, "resources", None)
    if resources is None and isinstance(lovelace, dict):
        resources = lovelace.get("resources")
    if resources is None or not hasattr(resources, "async_create_item"):
        return False
    try:
        if not getattr(resources, "loaded", True):
            await resources.async_load()
            resources.loaded = True
        existing = [r for r in resources.async_items() if str(r.get("url", "")).startswith(CARD_URL)]
        if not existing:
            await resources.async_create_item({"res_type": "module", "url": url})
            _LOGGER.info("Lovelace-Ressource %s angelegt", url)
        elif existing[0]["url"] != url:
            await resources.async_update_item(existing[0]["id"], {"res_type": "module", "url": url})
            _LOGGER.info("Lovelace-Ressource auf %s aktualisiert", url)
        return True
    except Exception:  # noqa: BLE001 – Ressourcenverwaltung ist optional
        _LOGGER.warning("Lovelace-Ressource konnte nicht angelegt werden – bitte manuell %s als JavaScript-Modul eintragen", url, exc_info=True)
        return False


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    coordinator = CompassCoordinator(hass, entry)
    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_reload))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def _reload(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)
