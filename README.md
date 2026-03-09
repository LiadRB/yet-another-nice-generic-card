# Yet Another Nice Generic Card (YANGC)

A beautiful, modern Home Assistant custom card with glassmorphism design for controlling lights, curtains, and media players.

## Features

- **Collapsible card** - Click the title bar to collapse/expand the entire card. Only the header stays visible when collapsed.
- **Lights & switches** - Toggle buttons with active glow effects
- **Curtains & blinds** - Slider controls with reversed logic support
- **Media players** - Full playback controls including:
  - Play/pause, previous/next track
  - Shuffle and repeat toggles (off/all/one)
  - Volume slider with mute toggle
  - Source selection dropdown
  - Power on/off
- **Quick actions** - Batch control buttons (turn on/off all, open/close curtains)
- **Customizable section titles** - Override default Hebrew titles
- **Accent color theming** - Pick a color to distinguish each card
- **RTL support** - Built for Hebrew and other RTL languages
- **Exclude from actions** - Mark entities to skip in bulk operations

## Installation

### HACS (Recommended)

1. Add this repository as a custom repository in HACS
2. Install "Yet Another Nice Generic Card"
3. Add the resource in your dashboard

### Manual

1. Download `yangc.js` from this repository
2. Copy it to your Home Assistant `www` folder
3. Add the resource to your Lovelace configuration:

```yaml
resources:
  - url: /local/yangc.js
    type: module
```

## Configuration

```yaml
type: custom:yangc
title: Living Room
icon: mdi:sofa
accent_color: '#667eea'        # Optional - hex color (default: blue-purple)
collapsed_default: true        # Optional - start collapsed (default: true)
lights_title: תאורה ומזגן       # Optional - override lights section title
curtains_title: וילונות         # Optional - override curtains section title
media_title: מדיה              # Optional - override media section title
actions_title: פעולות מהירות    # Optional - override quick actions title
lights:
  - entity: switch.ceiling_light
    name: Ceiling
    icon: mdi:ceiling-light
    exclude_from_actions: true  # Optional - skip in "Turn Off All"
  - entity: switch.led_strip
    name: LED Strip
    icon: mdi:led-strip
curtains:
  - entity: cover.living_room_curtain
    name: Main Curtain
    reversed: false             # Set true if open/close are inverted
media_players:
  - entity: media_player.living_room_speaker
    name: Speaker
    icon: mdi:speaker
```

## Configuration Wizard

Open `wizard.html` in your browser for an interactive configuration wizard with live preview. It lets you:

- Configure all card settings visually
- Connect to your Home Assistant instance to browse entities
- Generate ready-to-paste YAML
- Import existing configurations

## Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | `חדר אוכל` | Card title displayed in the header |
| `icon` | string | `mdi:food` | Header icon |
| `accent_color` | string | `#667eea` | Hex color for card accent |
| `collapsed_default` | boolean | `true` | Whether the card starts collapsed |
| `lights_title` | string | `תאורה ומזגן` | Lights section title |
| `curtains_title` | string | `וילונות` | Curtains section title |
| `media_title` | string | `מדיה` | Media section title |
| `actions_title` | string | `פעולות מהירות` | Quick actions section title |
| `lights` | list | `[]` | Light/switch entities |
| `curtains` | list | `[]` | Cover/curtain entities |
| `media_players` | list | `[]` | Media player entities |

### Entity Options

**Lights:**
| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `entity` | string | Yes | Entity ID (e.g., `switch.example`) |
| `name` | string | No | Display name |
| `icon` | string | No | MDI icon |
| `exclude_from_actions` | boolean | No | Skip in batch operations |

**Curtains:**
| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `entity` | string | Yes | Entity ID (e.g., `cover.example`) |
| `name` | string | No | Display name |
| `reversed` | boolean | No | Invert open/close logic |
| `exclude_from_actions` | boolean | No | Skip in batch operations |

**Media Players:**
| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `entity` | string | Yes | Entity ID (e.g., `media_player.example`) |
| `name` | string | No | Display name |
| `icon` | string | No | MDI icon |
