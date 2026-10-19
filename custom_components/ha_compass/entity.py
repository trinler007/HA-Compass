"""Gemeinsame Basis."""
from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo

from .const import DOMAIN


def device_info() -> DeviceInfo:
    return DeviceInfo(
        identifiers={(DOMAIN, DOMAIN)},
        name="HA Compass",
        manufacturer="trinler007",
        model="Sonne · Mond · Ausrichtung",
        entry_type=DeviceEntryType.SERVICE,
    )
