"""Sensoren für HA Compass."""
from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import DEGREE, PERCENTAGE, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import Event, EventStateChangedData, HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from . import astro
from .const import CONF_HEADING, DEFAULT_HEADING
from .coordinator import CompassCoordinator
from .entity import device_info

PHASE_OPTIONS = sorted({name for _, name in astro.PHASES})
SHADE_OPTIONS = ["links", "rechts", "front", "heck", "keine"]


@dataclass(frozen=True, kw_only=True)
class CompassSensorDescription(SensorEntityDescription):
    value: Callable[[dict[str, Any]], Any]
    attrs: Callable[[dict[str, Any]], dict[str, Any]] | None = None


def _angle(key: str, value_key: str, icon: str, **kw) -> CompassSensorDescription:
    return CompassSensorDescription(
        key=key, translation_key=key, icon=icon, native_unit_of_measurement=DEGREE,
        state_class=SensorStateClass.MEASUREMENT, suggested_display_precision=1,
        value=lambda d, k=value_key: d[k], **kw,
    )


def _time(key: str, value_key: str, icon: str, az_key: str | None = None) -> CompassSensorDescription:
    return CompassSensorDescription(
        key=key, translation_key=key, icon=icon, device_class=SensorDeviceClass.TIMESTAMP,
        value=lambda d, k=value_key: d[k],
        attrs=(lambda d, a=az_key: {"azimut": d[a]}) if az_key else None,
    )


SENSORS: tuple[CompassSensorDescription, ...] = (
    _angle("sonne_azimut", "sun_azimuth", "mdi:sun-compass"),
    _angle("sonne_hoehe", "sun_elevation", "mdi:sun-angle"),
    _time("daemmerung_beginn", "dawn", "mdi:weather-sunset-up"),
    _time("sonnenaufgang", "sunrise", "mdi:weather-sunset-up", "sunrise_azimuth"),
    CompassSensorDescription(
        key="sonnenmittag", translation_key="sonnenmittag", icon="mdi:white-balance-sunny",
        device_class=SensorDeviceClass.TIMESTAMP, value=lambda d: d["noon"],
        attrs=lambda d: {"hoehe": d["noon_elevation"]},
    ),
    _time("sonnenuntergang", "sunset", "mdi:weather-sunset-down", "sunset_azimuth"),
    _time("daemmerung_ende", "dusk", "mdi:weather-sunset-down"),
    _angle("mond_azimut", "moon_azimuth", "mdi:moon-waning-crescent"),
    _angle("mond_hoehe", "moon_elevation", "mdi:angle-acute"),
    CompassSensorDescription(
        key="mond_beleuchtung", translation_key="mond_beleuchtung", icon="mdi:brightness-6",
        native_unit_of_measurement=PERCENTAGE, state_class=SensorStateClass.MEASUREMENT,
        value=lambda d: d["moon_illumination"],
    ),
    CompassSensorDescription(
        key="mond_phase", translation_key="mond_phase", icon="mdi:moon-first-quarter",
        device_class=SensorDeviceClass.ENUM, options=PHASE_OPTIONS,
        value=lambda d: d["moon_phase"],
        attrs=lambda d: {"phase": d["moon_phase_value"], "entfernung_km": d["moon_distance"]},
    ),
    _time("mondaufgang", "moonrise", "mdi:arrow-up-thin"),
    _time("monduntergang", "moonset", "mdi:arrow-down-thin"),
)


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator: CompassCoordinator = entry.runtime_data
    heading = entry.options.get(CONF_HEADING, entry.data.get(CONF_HEADING, DEFAULT_HEADING))
    entities: list[SensorEntity] = [CompassSensor(coordinator, d) for d in SENSORS]
    entities += [SunRelativeSensor(coordinator, heading), ShadeSideSensor(coordinator, heading)]
    async_add_entities(entities)


class CompassSensor(CoordinatorEntity[CompassCoordinator], SensorEntity):
    _attr_has_entity_name = True
    entity_description: CompassSensorDescription

    def __init__(self, coordinator: CompassCoordinator, description: CompassSensorDescription) -> None:
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_unique_id = f"ha_compass_{description.key}"
        self.entity_id = f"sensor.ha_compass_{description.key}"
        self._attr_device_info = device_info()

    @property
    def native_value(self) -> Any:
        return self.entity_description.value(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        if self.entity_description.attrs is None:
            return None
        return self.entity_description.attrs(self.coordinator.data)


class _HeadingBase(CoordinatorEntity[CompassCoordinator], SensorEntity):
    """Wert relativ zur Fahrzeugausrichtung; aktualisiert bei Änderung der Ausrichtung (≥ 1°)."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: CompassCoordinator, heading_entity: str, key: str) -> None:
        super().__init__(coordinator)
        self._heading_entity = heading_entity
        self._attr_translation_key = key
        self._attr_unique_id = f"ha_compass_{key}"
        self.entity_id = f"sensor.ha_compass_{key}"
        self._attr_device_info = device_info()
        self._last: Any = None

    def _heading(self) -> float | None:
        state = self.hass.states.get(self._heading_entity)
        if state is None or state.state in (STATE_UNKNOWN, STATE_UNAVAILABLE):
            return None
        try:
            return float(state.state)
        except ValueError:
            return None

    def _relative(self) -> float | None:
        heading = self._heading()
        if heading is None:
            return None
        return round(astro.relative_bearing(self.coordinator.data["sun_azimuth"], heading), 1)

    @property
    def available(self) -> bool:
        return super().available and self._heading() is not None

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(
            async_track_state_change_event(self.hass, [self._heading_entity], self._on_heading)
        )

    @callback
    def _on_heading(self, event: Event[EventStateChangedData]) -> None:
        value = self.native_value
        if self._changed(value):
            self._last = value
            self.async_write_ha_state()

    def _changed(self, value: Any) -> bool:
        return value != self._last


class SunRelativeSensor(_HeadingBase):
    """Sonnenwinkel zum Bug: -180..180°, + = rechts (Beifahrerseite)."""

    _attr_icon = "mdi:axis-z-rotate-clockwise"
    _attr_native_unit_of_measurement = DEGREE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 0

    def __init__(self, coordinator: CompassCoordinator, heading_entity: str) -> None:
        super().__init__(coordinator, heading_entity, "sonne_relativ")

    @property
    def native_value(self) -> float | None:
        return self._relative()

    def _changed(self, value: Any) -> bool:
        if value is None or self._last is None:
            return value != self._last
        return abs(value - self._last) >= 1


class ShadeSideSensor(_HeadingBase):
    """Beschattete Fahrzeugseite."""

    _attr_icon = "mdi:umbrella-beach-outline"
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = SHADE_OPTIONS

    def __init__(self, coordinator: CompassCoordinator, heading_entity: str) -> None:
        super().__init__(coordinator, heading_entity, "schattenseite")

    @property
    def native_value(self) -> str | None:
        rel = self._relative()
        if rel is None:
            return None
        return astro.shade_side(rel, self.coordinator.data["sun_elevation"])
