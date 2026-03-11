# Yet Another Nice Generic Card (YANGC)

A beautiful, modern Home Assistant custom Lovelace card with glassmorphism design. Control lights, switches, curtains, media players, climate devices, fans, sensors, locks, and custom actions - all from one card.

[![HACS Badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/v/release/LiadRB/yet-another-nice-generic-card)](https://github.com/LiadRB/yet-another-nice-generic-card/releases)

---

## Features

### Card-Level
- **Collapsible card** - Click the header to collapse/expand the entire card; only the header stays visible when collapsed
- **Collapsible sections** - Each section can be individually collapsed/expanded with smooth animations
- **Accent color theming** - Pick any hex color to give each card a unique look
- **RTL & multilingual** - Built-in support for Hebrew, English, and Russian; auto-detects from Home Assistant locale
- **Visual editor** - Full GUI editor inside Home Assistant (no YAML needed)
- **Configuration wizard** - Open `wizard.html` in your browser for a standalone visual config builder with live preview
- **Embedded stack mode** - Combine multiple card configs as categories with tab navigation in a single card
- **Persistent state** - Card and section collapse states are saved per card across page refreshes

### Section Types

| Type | Description |
|------|-------------|
| `toggle` | Lights and switches with tap-to-toggle, optional brightness control |
| `cover` | Curtains and blinds with slider or button controls, reversed logic support |
| `media_player` | Full media controls: play/pause, skip, shuffle, repeat, volume, source selection |
| `climate` | Climate / AC controls with temperature, mode selection, and fan speed |
| `fan` | Fan entities with speed control |
| `sensor` | Display sensor readings (temperature, humidity, etc.) |
| `lock` | Lock/unlock control |
| `action` | Custom action buttons (scripts, scenes, etc.) |
| `mixed` | Combine toggles and covers in a single section |

### Quick Actions
- **Batch control buttons** - Turn on/off all lights, open/close all curtains
- **Per-entity exclusion** - Mark any entity to be skipped by quick action buttons using `exclude_from_actions`, or the more granular `exclude_from_turn_on`, `exclude_from_turn_off`, `exclude_from_open`, `exclude_from_close`
- **Visual indicator** - Excluded entities display a badge so you know at a glance

### Media Player
- Play/pause, previous/next track, shuffle, repeat (off/all/one)
- Volume slider or +/- buttons (auto-detected or configurable)
- Source selection with optional shortcut buttons
- Mute toggle
- Album art display
- Power on/off
- Apple TV, Android TV, and Roku device family support with remote entity routing

---

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to **Frontend** > click the 3-dot menu > **Custom repositories**
3. Add `LiadRB/yet-another-nice-generic-card` with category **Dashboard**
4. Click **Install**
5. Restart Home Assistant and clear your browser cache

### Manual

1. Download `yangc.js` from the [latest release](https://github.com/LiadRB/yet-another-nice-generic-card/releases)
2. Copy it to your Home Assistant `/config/www/` folder
3. Add the resource in **Settings > Dashboards > Resources**:

```yaml
resources:
  - url: /local/yangc.js
    type: module
```

---

## Quick Start

Minimal config to get started:

```yaml
type: custom:yangc-card
title: Living Room
icon: mdi:sofa
sections:
  - type: toggle
    title: Lights
    icon: mdi:lightbulb-group
    entities:
      - entity: light.ceiling
        name: Ceiling Light
      - entity: switch.led_strip
        name: LED Strip
```

---

## Full Configuration

```yaml
type: custom:yangc-card
title: Living Room
icon: mdi:sofa
accent_color: '#667eea'
collapsed_default: true
always_open: false
lights_columns: 3
language: he

sections:
  # --- Lights & Switches ---
  - type: toggle
    title: תאורה ומזגן
    icon: mdi:lightbulb-group
    columns: 3
    entities:
      - entity: light.ceiling
        name: Ceiling
        icon: mdi:ceiling-light
        color: '#3b82f6'
        show_brightness: true
      - entity: switch.ac
        name: AC
        icon: mdi:air-conditioner
        exclude_from_actions: true    # Won't be toggled by quick actions

  # --- Curtains ---
  - type: cover
    title: Curtains
    icon: mdi:curtains
    control_mode: slider              # 'slider' (default) or 'buttons'
    entities:
      - entity: cover.living_room
        name: Main Curtain
        reversed: false
        orientation: horizontal       # 'horizontal' (default) or 'vertical'

  # --- Media Players ---
  - type: media_player
    title: Media
    icon: mdi:speaker
    media_device_family: apple-tv     # 'apple-tv', 'android-tv', 'roku', or omit
    media_volume_control_ui: auto     # 'auto', 'slider', or 'buttons'
    entities:
      - entity: media_player.living_room
        name: Apple TV
        icon: mdi:apple
        remote_entity: remote.apple_tv
        volume_entity: media_player.soundbar
        mute_entity: switch.soundbar_mute
        volume_control_ui: buttons
        source_shortcuts:
          - Spotify
          - Netflix
          - YouTube

  # --- Climate / AC ---
  - type: climate
    title: Climate
    icon: mdi:air-conditioner
    entities:
      - entity: climate.living_room
        name: AC
        visible_modes:
          - cool
          - heat
          - auto
          - fan_only

  # --- Fans ---
  - type: fan
    title: Fans
    icon: mdi:fan
    entities:
      - entity: fan.ceiling_fan
        name: Ceiling Fan

  # --- Sensors ---
  - type: sensor
    title: Sensors
    icon: mdi:motion-sensor
    entities:
      - entity: sensor.temperature
        name: Temperature
      - entity: sensor.humidity
        name: Humidity

  # --- Locks ---
  - type: lock
    title: Locks
    icon: mdi:lock
    entities:
      - entity: lock.front_door
        name: Front Door

  # --- Custom Actions ---
  - type: action
    title: Scenes
    icon: mdi:gesture-tap-button
    entities:
      - entity: script.goodnight
        name: Goodnight
        icon: mdi:weather-night
      - entity: scene.movie_mode
        name: Movie Mode
        icon: mdi:movie-open

  # --- Mixed (toggles + covers together) ---
  - type: mixed
    title: Mixed Controls
    icon: mdi:view-grid-outline
    columns: 2
    entities:
      - entity: switch.lamp
        name: Lamp
        show_state: true
      - entity: cover.blinds
        name: Blinds
        reversed: true

# Quick Actions (optional)
automations:
  enabled: true
  title: Quick Actions
  icon: mdi:lightning-bolt
```

---

## Options Reference

### Card Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | `חדר אוכל` | Card title displayed in the header |
| `icon` | string | `mdi:food` | Header icon (any MDI icon) |
| `accent_color` | string | `#667eea` | Hex color for the card accent/gradient |
| `collapsed_default` | boolean | `true` | Whether the card starts collapsed |
| `always_open` | boolean | `false` | Disable card collapse entirely |
| `lights_columns` | number | `3` | Default grid columns for toggle sections (1-6) |
| `language` | string | auto | Force language: `he`, `en`, or `ru` |
| `lights_title` | string | `תאורה ומזגן` | Override lights section title (legacy mode) |
| `curtains_title` | string | `וילונות` | Override curtains section title (legacy mode) |
| `media_title` | string | `מדיה` | Override media section title (legacy mode) |
| `actions_title` | string | `פעולות מהירות` | Override quick actions title |
| `media_device_family` | string | | Device family: `apple-tv`, `android-tv`, `roku` |
| `media_volume_control_ui` | string | `auto` | Volume UI: `auto`, `slider`, or `buttons` |

### Section Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `type` | string | Yes | `toggle`, `cover`, `media_player`, `climate`, `fan`, `sensor`, `lock`, `action`, `mixed` |
| `title` | string | No | Section header text |
| `icon` | string | No | Section header icon |
| `id` | string | No | Unique section ID (auto-generated if omitted) |
| `visible` | boolean | No | Set `false` to hide the section |
| `columns` | number | No | Grid columns for toggle/mixed sections (1-6) |
| `control_mode` | string | No | Cover sections: `slider` (default) or `buttons` |
| `media_device_family` | string | No | Per-section device family override |
| `media_volume_control_ui` | string | No | Per-section volume UI override |

### Entity Options

**All entity types:**

| Option | Type | Description |
|--------|------|-------------|
| `entity` | string | Entity ID (required) |
| `name` | string | Display name |
| `icon` | string | MDI icon override |
| `color` | string | Hex color for the entity button |

**Toggle entities (lights/switches):**

| Option | Type | Description |
|--------|------|-------------|
| `exclude_from_actions` | boolean | Skip this entity in all quick actions |
| `exclude_from_turn_on` | boolean | Skip only for "Turn On All" |
| `exclude_from_turn_off` | boolean | Skip only for "Turn Off All" |
| `show_brightness` | boolean | Show brightness slider for light entities |

**Cover entities (curtains/blinds):**

| Option | Type | Description |
|--------|------|-------------|
| `reversed` | boolean | Invert open/close logic |
| `orientation` | string | `horizontal` (default) or `vertical` |
| `exclude_from_actions` | boolean | Skip in quick actions |

**Media player entities:**

| Option | Type | Description |
|--------|------|-------------|
| `remote_entity` | string | Remote entity for IR/device control |
| `volume_entity` | string | Separate entity for volume control |
| `mute_entity` | string | Separate entity for mute state |
| `mute_script` | string | Script entity to toggle mute |
| `device_family` | string | `apple-tv`, `android-tv`, `roku` |
| `volume_control_ui` | string | `auto`, `slider`, or `buttons` |
| `source_shortcuts` | list | Up to 6 source names for quick-select buttons |

**Climate entities:**

| Option | Type | Description |
|--------|------|-------------|
| `visible_modes` | list | Which HVAC modes to show (e.g., `cool`, `heat`, `auto`, `fan_only`) |

**Mixed entities:**

| Option | Type | Description |
|--------|------|-------------|
| `show_state` | boolean | Display entity state text |
| `exclude_from_turn_on` | boolean | Skip for "Turn On All" |
| `exclude_from_turn_off` | boolean | Skip for "Turn Off All" |
| `exclude_from_open` | boolean | Skip for "Open All" |
| `exclude_from_close` | boolean | Skip for "Close All" |

---

## Legacy Configuration

The card also supports flat (non-sections) configuration for backwards compatibility:

```yaml
type: custom:yangc-card
title: Living Room
icon: mdi:sofa
accent_color: '#667eea'
lights:
  - entity: switch.ceiling
    name: Ceiling
    icon: mdi:ceiling-light
curtains:
  - entity: cover.main_curtain
    name: Curtain
    reversed: false
media_players:
  - entity: media_player.speaker
    name: Speaker
```

This is automatically converted to the sections format internally.

---

## Configuration Wizard

Open `wizard.html` in any browser for an interactive configuration builder:

- Configure all card settings visually with a live preview
- Connect to your Home Assistant instance to browse available entities
- Generate ready-to-paste YAML
- Import/export configurations
- Save/load from browser localStorage

---

## Embedded Stack Mode

Combine multiple room configs into a single card with tab navigation:

```yaml
type: custom:yangc-card
__yangc_editor_state:
  categories:
    - id: living_room
      name: Living Room
      config:
        title: Living Room
        icon: mdi:sofa
        accent_color: '#667eea'
        sections:
          - type: toggle
            entities:
              - entity: light.living_room
                name: Ceiling
    - id: bedroom
      name: Bedroom
      config:
        title: Bedroom
        icon: mdi:bed
        accent_color: '#ef4444'
        sections:
          - type: toggle
            entities:
              - entity: light.bedroom
                name: Ceiling
  activeCategoryIndex: 0
```

---

## Changelog

### v0.2.0
- Major card rewrite with section-based architecture
- Added 8 section types: toggle, cover, media_player, climate, fan, sensor, lock, action, mixed
- Collapsible sections with persistent state
- Per-entity granular exclusion from quick actions (`exclude_from_turn_on`, `exclude_from_turn_off`, `exclude_from_open`, `exclude_from_close`)
- Brightness slider support for light entities
- Climate controls with temperature and mode selection
- Media player: shuffle, repeat, source shortcuts, device family support (Apple TV, Android TV, Roku)
- Volume control via separate entity with auto-detection
- Embedded stack mode for multi-room cards
- Multilingual support (Hebrew, English, Russian)
- Full visual editor integration
- Enhanced wizard with entity browser and live preview

### v0.1.2
- Fix visual editor errors
- Match wizard preview to actual card

### v0.1.1
- Initial release with lights, curtains, and media player support

---

## License

MIT
