/**
 * Yet Another Nice Generic Card (YANGC) for Home Assistant
 * A beautiful, modern card with glassmorphism design
 *
 * Configuration example:
 * type: custom:yangc
 * title: פינת אוכל
 * accent_color: '#667eea'  # Optional - hex color for card accent (default: blue-purple)
 * collapsed_default: true  # Optional - whether card starts collapsed (default: true)
 * lights:
 *   - entity: switch.mtbkh_switch_4_2
 *     name: תקרה
 *     icon: mdi:ceiling-light-multiple-outline
 *   - entity: switch.knysh_vkhvts_switch_3_2
 *     name: פס לד
 *     icon: mdi:led-strip
 *   - entity: switch.dining_room_ac
 *     name: מזגן
 *     icon: mdi:air-conditioner
 *     exclude_from_actions: true  # Won't be affected by "Turn On/Off All" buttons
 * curtains:
 *   - entity: cover.vylvn_pynt_vkl_qtn_zmysmrt_curtain
 *     name: וילון קטן
 *     reversed: false
 *   - entity: cover.vylvn_gdvl_pynt_vkl_curtain
 *     name: וילון גדול
 *     reversed: true  # Set to true if open/close are inverted
 */

if (!customElements.get('yangc-card')) {

class YangcCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._actionDelay = 150; // ms between each action
        this._isDragging = false;
        this._isDraggingVolume = false;
        this._collapsedSections = new Set();
        this._cardCollapsed = null; // will be set from config
    }

    set hass(hass) {
        this._hass = hass;
        this._updateCard();
    }

    setConfig(config) {
        if (!config.lights && !config.curtains && !config.media_players) {
            throw new Error('Please define at least one light, curtain, or media player entity');
        }
        this._config = {
            title: config.title || 'חדר אוכל',
            icon: config.icon || 'mdi:food',
            lights: config.lights || [],
            curtains: config.curtains || [],
            media_players: config.media_players || [],
            collapsed_default: config.collapsed_default !== undefined ? config.collapsed_default : true,
            lights_title: config.lights_title || 'תאורה ומזגן',
            curtains_title: config.curtains_title || 'וילונות',
            media_title: config.media_title || 'מדיה',
            actions_title: config.actions_title || 'פעולות מהירות',
            ...config
        };
        // Only set from config on first load (null), preserve user toggle after that
        if (this._cardCollapsed === null) {
            this._cardCollapsed = this._config.collapsed_default;
        }
        this._render();
    }

    getCardSize() {
        return 4;
    }

    _render() {
        this.shadowRoot.innerHTML = `
      <style>
        ${this._getStyles()}
      </style>
      <div class="card-container ${this._cardCollapsed ? 'card-collapsed' : ''}">
        <div class="card-header" id="card-header-toggle">
          <ha-icon icon="${this._config.icon}" class="header-icon"></ha-icon>
          <span class="header-title">${this._config.title}</span>
          <ha-icon icon="mdi:chevron-down" class="header-chevron"></ha-icon>
        </div>
        
        <div class="content">
          ${this._config.lights.length > 0 ? `
            <div class="section">
              <div class="section-title">
                <ha-icon icon="mdi:lightbulb-group" class="section-icon"></ha-icon>
                <span>${this._config.lights_title}</span>
              </div>
              <div class="lights-grid" id="lights-container">
                <!-- Lights will be rendered here -->
              </div>
            </div>
          ` : ''}

          ${this._config.curtains.length > 0 ? `
            <div class="section">
              <div class="section-title">
                <ha-icon icon="mdi:curtains" class="section-icon"></ha-icon>
                <span>${this._config.curtains_title}</span>
              </div>
              <div class="curtains-container" id="curtains-container">
                <!-- Curtains will be rendered here -->
              </div>
            </div>
          ` : ''}

          ${this._config.media_players.length > 0 ? `
            <div class="section">
              <div class="section-title">
                <ha-icon icon="mdi:speaker" class="section-icon"></ha-icon>
                <span>${this._config.media_title}</span>
              </div>
              <div class="media-players-container" id="media-players-container">
              </div>
            </div>
          ` : ''}

          <div class="section actions-section">
            <div class="section-title">
              <ha-icon icon="mdi:lightning-bolt" class="section-icon"></ha-icon>
              <span>${this._config.actions_title}</span>
            </div>
            <div class="actions-grid">
              ${this._config.curtains.length > 0 ? `
              <button class="action-btn open-curtains" id="btn-open-curtains">
                <ha-icon icon="mdi:curtains"></ha-icon>
                <span>פתח וילונות</span>
              </button>
              <button class="action-btn close-curtains" id="btn-close-curtains">
                <ha-icon icon="mdi:blinds-horizontal-closed"></ha-icon>
                <span>סגור וילונות</span>
              </button>
              ` : `
              <button class="action-btn lights-on" id="btn-lights-on">
                <ha-icon icon="mdi:lightbulb-on"></ha-icon>
                <span>הדלק הכל</span>
              </button>
              `}
              <button class="action-btn turn-off" id="btn-turn-off">
                <ha-icon icon="mdi:power-sleep"></ha-icon>
                <span>${this._config.curtains.length > 0 ? 'סגור וכבה הכל' : 'כבה הכל'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

        this._attachEventListeners();
    }

    _getStyles() {
        const accentColor = this._config.accent_color;
        let accentGradient, accentVar, accentRgb;
        if (accentColor) {
            const rgb = this._hexToRgb(accentColor);
            const darker = this._darkenHex(accentColor, 0.25);
            accentGradient = `linear-gradient(135deg, ${accentColor} 0%, ${darker} 100%)`;
            accentVar = accentColor;
            accentRgb = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
        } else {
            accentGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            accentVar = '#667eea';
            accentRgb = '102, 126, 234';
        }
        return `
      :host {
        --card-bg: rgba(30, 30, 40, 0.85);
        --card-border: rgba(255, 255, 255, 0.1);
        --accent-gradient: ${accentGradient};
        --accent-color: ${accentVar};
        --accent-rgb: ${accentRgb};
        --accent-glow: rgba(var(--accent-rgb), 0.4);
        --text-primary: #ffffff;
        --text-secondary: rgba(255, 255, 255, 0.7);
        --success-color: #4ade80;
        --success-glow: rgba(74, 222, 128, 0.4);
        --warning-color: #fbbf24;
        --danger-color: #ef4444;
        --danger-glow: rgba(239, 68, 68, 0.3);
        --item-bg: rgba(255, 255, 255, 0.05);
        --item-bg-hover: rgba(255, 255, 255, 0.1);
        --item-active: rgba(var(--accent-rgb), 0.2);
        --curtain-open: #3b82f6;
        --curtain-closed: #6b7280;
        direction: rtl;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .card-container {
        background: var(--card-bg);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 24px;
        border: 1px solid var(--card-border);
        overflow: hidden;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      }

      .card-header {
        background: var(--accent-gradient);
        padding: 20px 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        position: relative;
        overflow: hidden;
        cursor: pointer;
        user-select: none;
      }

      .card-header::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
        animation: shimmer 3s ease-in-out infinite;
      }

      @keyframes shimmer {
        0%, 100% { transform: translateX(-10%) translateY(-10%); }
        50% { transform: translateX(10%) translateY(10%); }
      }

      .header-icon {
        --mdc-icon-size: 28px;
        color: var(--text-primary);
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        position: relative;
        z-index: 1;
      }

      .header-title {
        font-size: 1.4rem;
        font-weight: 600;
        color: var(--text-primary);
        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        position: relative;
        z-index: 1;
        flex: 1;
        text-align: center;
      }

      .header-chevron {
        --mdc-icon-size: 22px;
        color: var(--text-primary);
        position: relative;
        z-index: 1;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0.7;
      }

      .card-collapsed .header-chevron {
        transform: rotate(-90deg);
      }

      .card-container .content {
        overflow: hidden;
        max-height: 2000px;
        transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, padding 0.4s ease;
        opacity: 1;
      }

      .card-collapsed .content {
        max-height: 0;
        opacity: 0;
        padding: 0 20px;
      }

      .content {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .section {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-secondary);
        font-size: 0.85rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .section-icon {
        --mdc-icon-size: 18px;
        color: var(--accent-color);
      }

      /* Lights Grid */
      .lights-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 12px;
      }

      .light-btn {
        background: var(--item-bg);
        border: 1px solid transparent;
        border-radius: 16px;
        padding: 16px 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .light-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--accent-gradient);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .light-btn:hover {
        background: var(--item-bg-hover);
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      }

      .light-btn.active {
        background: var(--item-active);
        border-color: var(--accent-color);
        box-shadow: 0 0 20px var(--accent-glow);
      }

      .light-btn.active::before {
        opacity: 0.15;
      }

      .light-btn.active .light-icon {
        color: var(--warning-color);
        filter: drop-shadow(0 0 10px var(--warning-color));
        animation: pulse-glow 2s ease-in-out infinite;
      }

      @keyframes pulse-glow {
        0%, 100% { filter: drop-shadow(0 0 8px var(--warning-color)); }
        50% { filter: drop-shadow(0 0 15px var(--warning-color)); }
      }

      .light-icon {
        --mdc-icon-size: 32px;
        color: var(--text-secondary);
        transition: all 0.3s ease;
        position: relative;
        z-index: 1;
      }

      .light-name {
        font-size: 0.85rem;
        color: var(--text-primary);
        text-align: center;
        position: relative;
        z-index: 1;
      }

      /* Excluded from actions badge */
      .light-btn .exclude-badge {
        position: absolute;
        top: 6px;
        left: 6px;
        --mdc-icon-size: 14px;
        color: var(--text-secondary);
        opacity: 0.5;
        z-index: 2;
        transition: opacity 0.2s ease;
      }

      .light-btn:hover .exclude-badge {
        opacity: 0.8;
      }

      .curtain-item .exclude-badge {
        position: absolute;
        top: 8px;
        left: 8px;
        --mdc-icon-size: 14px;
        color: var(--text-secondary);
        opacity: 0.5;
        z-index: 2;
      }

      .curtain-item {
        position: relative;
      }

      /* Curtains */
      .curtains-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .curtain-item {
        background: var(--item-bg);
        border-radius: 16px;
        padding: 20px 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        transition: all 0.3s ease;
        border: 1px solid transparent;
      }

      .curtain-item:hover {
        background: var(--item-bg-hover);
      }

      .curtain-item.open {
        border-color: rgba(59, 130, 246, 0.3);
      }

      .curtain-item.closed {
        border-color: rgba(107, 114, 128, 0.3);
      }

      .curtain-item.partial {
        border-color: rgba(139, 92, 246, 0.3);
      }

      .curtain-name {
        font-size: 1rem;
        color: #ffffff;
        font-weight: 600;
        text-align: center;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.6), 0 0 25px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1);
      }

      /* Curtain Slider */
      .curtain-slider-row {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 0 4px;
      }

      .curtain-slider {
        flex: 1;
        height: 6px;
        -webkit-appearance: none;
        appearance: none;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        outline: none;
        direction: ltr;
        box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.15);
        transition: box-shadow 0.3s ease;
      }

      .curtain-slider:hover {
        box-shadow: 0 0 12px rgba(var(--accent-rgb), 0.3);
      }

      .curtain-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--accent-gradient);
        cursor: pointer;
        box-shadow: 0 0 12px var(--accent-glow), 0 0 24px rgba(var(--accent-rgb), 0.2);
        margin-top: -8px;
        transition: box-shadow 0.3s ease;
      }

      .curtain-slider:active::-webkit-slider-thumb {
        box-shadow: 0 0 18px var(--accent-glow), 0 0 36px rgba(var(--accent-rgb), 0.35);
        transform: scale(1.15);
      }

      .curtain-slider::-moz-range-thumb {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--accent-color);
        cursor: pointer;
        border: none;
        box-shadow: 0 0 12px var(--accent-glow), 0 0 24px rgba(var(--accent-rgb), 0.2);
      }

      .curtain-slider:active::-moz-range-thumb {
        box-shadow: 0 0 18px var(--accent-glow), 0 0 36px rgba(var(--accent-rgb), 0.35);
      }

      .slider-value {
        font-size: 0.8rem;
        color: var(--accent-color);
        min-width: 36px;
        text-align: center;
        font-weight: 500;
        text-shadow: 0 0 8px var(--accent-glow);
      }

      /* Media Players */
      .media-players-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .media-player-item {
        background: var(--item-bg);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        transition: all 0.3s ease;
        border: 1px solid transparent;
        overflow: hidden;
      }

      .media-player-item.playing {
        border-color: rgba(var(--accent-rgb), 0.3);
        box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.1);
        animation: media-glow 3s ease-in-out infinite;
      }

      .media-player-item.paused {
        border-color: rgba(251, 191, 36, 0.2);
      }

      @keyframes media-glow {
        0%, 100% { box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.1); }
        50% { box-shadow: 0 0 25px rgba(var(--accent-rgb), 0.25); }
      }

      .media-info {
        display: flex;
        gap: 14px;
        align-items: center;
      }

      .media-art {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.05);
        overflow: hidden;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 12px rgba(var(--accent-rgb), 0.15);
        transition: box-shadow 0.3s ease;
      }

      .media-player-item.playing .media-art {
        box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.35);
      }

      .media-art img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .media-art ha-icon {
        --mdc-icon-size: 28px;
        color: var(--text-secondary);
      }

      .media-details {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .media-title {
        font-size: 0.95rem;
        color: #ffffff;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.4), 0 0 20px rgba(255, 255, 255, 0.15);
      }

      .media-artist {
        font-size: 0.8rem;
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .media-state-text {
        font-size: 0.8rem;
        color: var(--text-secondary);
      }

      .media-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
      }

      .media-ctrl-btn {
        background: none;
        border: none;
        color: var(--text-primary);
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .media-ctrl-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: scale(1.1);
      }

      .media-ctrl-btn:active {
        transform: scale(0.95);
      }

      .media-ctrl-btn ha-icon {
        --mdc-icon-size: 22px;
      }

      .media-ctrl-btn.play-pause {
        background: var(--accent-gradient);
        width: 46px;
        height: 46px;
        box-shadow: 0 0 15px var(--accent-glow), 0 0 30px rgba(var(--accent-rgb), 0.15);
      }

      .media-ctrl-btn.play-pause:hover {
        box-shadow: 0 0 22px var(--accent-glow), 0 0 40px rgba(var(--accent-rgb), 0.25);
        transform: scale(1.1);
      }

      .media-ctrl-btn.play-pause ha-icon {
        --mdc-icon-size: 26px;
      }

      .media-ctrl-btn.power-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--card-border);
        width: 42px;
        height: 42px;
      }

      .media-ctrl-btn.power-btn:hover {
        background: rgba(var(--accent-rgb), 0.2);
        border-color: var(--accent-color);
        box-shadow: 0 0 12px var(--accent-glow);
      }

      .media-volume-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 4px;
      }

      .media-volume-icon {
        --mdc-icon-size: 18px;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .media-volume-icon:hover {
        color: var(--accent-color);
        filter: drop-shadow(0 0 6px var(--accent-glow));
      }

      .media-volume-icon.muted {
        color: var(--danger-color);
      }

      .media-volume-slider {
        flex: 1;
        height: 4px;
        -webkit-appearance: none;
        appearance: none;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        outline: none;
        direction: ltr;
        box-shadow: 0 0 6px rgba(var(--accent-rgb), 0.1);
        transition: box-shadow 0.3s ease;
      }

      .media-volume-slider:hover {
        box-shadow: 0 0 10px rgba(var(--accent-rgb), 0.25);
      }

      .media-volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--accent-gradient);
        cursor: pointer;
        box-shadow: 0 0 10px var(--accent-glow);
        margin-top: -6px;
      }

      .media-volume-slider:active::-webkit-slider-thumb {
        box-shadow: 0 0 16px var(--accent-glow), 0 0 30px rgba(var(--accent-rgb), 0.3);
        transform: scale(1.15);
      }

      .media-volume-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--accent-color);
        cursor: pointer;
        border: none;
        box-shadow: 0 0 10px var(--accent-glow);
      }

      .media-volume-value {
        font-size: 0.75rem;
        color: var(--accent-color);
        min-width: 30px;
        text-align: center;
        text-shadow: 0 0 6px var(--accent-glow);
      }

      /* Media source selector */
      .media-source-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 4px;
      }

      .media-source-icon {
        --mdc-icon-size: 18px;
        color: var(--text-secondary);
        flex-shrink: 0;
      }

      .media-source-select {
        flex: 1;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        color: var(--text-primary);
        padding: 6px 10px;
        font-size: 0.8rem;
        font-family: inherit;
        outline: none;
        cursor: pointer;
        direction: rtl;
        appearance: none;
        -webkit-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: left 8px center;
        padding-left: 24px;
        transition: all 0.2s ease;
      }

      .media-source-select:hover {
        border-color: var(--accent-color);
        background-color: rgba(255, 255, 255, 0.12);
      }

      .media-source-select:focus {
        border-color: var(--accent-color);
        box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.3);
      }

      .media-source-select option {
        background: #2a2a3a;
        color: #ffffff;
      }

      /* Media extra controls row */
      .media-extra-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 4px;
      }

      .media-ctrl-btn.small {
        padding: 6px;
        opacity: 0.6;
        transition: all 0.2s ease;
      }

      .media-ctrl-btn.small:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
      }

      .media-ctrl-btn.small.active-toggle {
        opacity: 1;
        color: var(--accent-color);
        filter: drop-shadow(0 0 6px var(--accent-glow));
      }

      .media-ctrl-btn.small ha-icon {
        --mdc-icon-size: 18px;
      }

      .media-ctrl-btn.power-inline {
        opacity: 0.6;
        transition: all 0.2s ease;
      }

      .media-ctrl-btn.power-inline:hover {
        opacity: 1;
        color: var(--danger-color);
        filter: drop-shadow(0 0 6px var(--danger-glow));
      }

      /* Action Buttons */
      .actions-section {
        border-top: 1px solid var(--card-border);
        padding-top: 20px;
        margin-top: 4px;
      }

      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 12px;
      }

      .action-btn {
        background: var(--item-bg);
        border: 1px solid var(--card-border);
        border-radius: 14px;
        padding: 14px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        color: var(--text-primary);
        position: relative;
        overflow: hidden;
      }

      .action-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .action-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }

      .action-btn:hover::before {
        opacity: 1;
      }

      .action-btn:active {
        transform: translateY(-1px);
      }

      .action-btn ha-icon {
        --mdc-icon-size: 26px;
        transition: all 0.3s ease;
        position: relative;
        z-index: 1;
      }

      .action-btn span {
        font-size: 0.8rem;
        font-weight: 500;
        position: relative;
        z-index: 1;
      }

      .action-btn.open-curtains::before {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2));
      }

      .action-btn.open-curtains:hover {
        border-color: var(--curtain-open);
      }

      .action-btn.open-curtains:hover ha-icon {
        color: var(--curtain-open);
        filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
      }

      .action-btn.close-curtains::before {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.2));
      }

      .action-btn.close-curtains:hover {
        border-color: #8b5cf6;
      }

      .action-btn.close-curtains:hover ha-icon {
        color: #8b5cf6;
        filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.5));
      }

      .action-btn.turn-off::before {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2));
      }

      .action-btn.turn-off:hover {
        border-color: var(--danger-color);
      }

      .action-btn.turn-off:hover ha-icon {
        color: var(--danger-color);
        filter: drop-shadow(0 0 8px var(--danger-glow));
      }

      .action-btn.lights-on::before {
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(234, 179, 8, 0.2));
      }

      .action-btn.lights-on:hover {
        border-color: var(--warning-color);
      }

      .action-btn.lights-on:hover ha-icon {
        color: var(--warning-color);
        filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.5));
      }

      /* Loading state for buttons */
      .action-btn.loading {
        pointer-events: none;
        opacity: 0.7;
      }

      .action-btn.loading ha-icon {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* Responsive */
      @media (max-width: 400px) {
        .actions-grid {
          grid-template-columns: 1fr;
        }
        
        .action-btn {
          flex-direction: row;
          justify-content: center;
        }
      }
    `;
    }

    _attachEventListeners() {
        // Card-level collapse toggle on header click
        const headerToggle = this.shadowRoot.getElementById('card-header-toggle');
        if (headerToggle) {
            headerToggle.addEventListener('click', () => {
                this._cardCollapsed = !this._cardCollapsed;
                const container = this.shadowRoot.querySelector('.card-container');
                if (this._cardCollapsed) {
                    container.classList.add('card-collapsed');
                } else {
                    container.classList.remove('card-collapsed');
                }
            });
        }

        // Global action buttons
        const openCurtainsBtn = this.shadowRoot.getElementById('btn-open-curtains');
        const closeCurtainsBtn = this.shadowRoot.getElementById('btn-close-curtains');
        const turnOffBtn = this.shadowRoot.getElementById('btn-turn-off');

        if (openCurtainsBtn) {
            openCurtainsBtn.addEventListener('click', () => this._openAllCurtains());
        }
        if (closeCurtainsBtn) {
            closeCurtainsBtn.addEventListener('click', () => this._closeAllCurtains());
        }
        if (turnOffBtn) {
            turnOffBtn.addEventListener('click', () => this._turnOffEverything());
        }

        const lightsOnBtn = this.shadowRoot.getElementById('btn-lights-on');
        if (lightsOnBtn) {
            lightsOnBtn.addEventListener('click', () => this._turnOnAllLights());
        }
    }

    _updateCard() {
        if (!this._hass || !this._config) return;

        this._renderLights();
        if (!this._isDragging) {
            this._renderCurtains();
        }
        if (!this._isDraggingVolume) {
            this._renderMediaPlayers();
        }
    }

    _renderLights() {
        const container = this.shadowRoot.getElementById('lights-container');
        if (!container) return;

        container.innerHTML = this._config.lights.map(light => {
            const state = this._hass.states[light.entity];
            const isOn = state && (state.state === 'on');
            const icon = light.icon || 'mdi:lightbulb';
            const excluded = light.exclude_from_actions === true;

            return `
        <button class="light-btn ${isOn ? 'active' : ''}" data-entity="${light.entity}">
          ${excluded ? '<ha-icon icon="mdi:link-off" class="exclude-badge" title="לא נכלל בפעולות מהירות"></ha-icon>' : ''}
          <ha-icon icon="${icon}" class="light-icon"></ha-icon>
          <span class="light-name">${light.name || light.entity}</span>
        </button>
      `;
        }).join('');

        // Attach click handlers
        container.querySelectorAll('.light-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const entity = btn.dataset.entity;
                this._toggleEntity(entity);
            });
        });
    }

    _renderCurtains() {
        const container = this.shadowRoot.getElementById('curtains-container');
        if (!container) return;

        container.innerHTML = this._config.curtains.map(curtain => {
            const state = this._hass.states[curtain.entity];
            const isReversed = curtain.reversed === true;
            const { stateClass, position } = this._getCurtainVisualState(state, isReversed);
            const excluded = curtain.exclude_from_actions === true;

            return `
        <div class="curtain-item ${stateClass}" data-entity="${curtain.entity}" data-reversed="${isReversed}">
          ${excluded ? '<ha-icon icon="mdi:link-off" class="exclude-badge" title="לא נכלל בפעולות מהירות"></ha-icon>' : ''}
          <span class="curtain-name">${curtain.name || curtain.entity}</span>
          <div class="curtain-slider-row">
            <input type="range" class="curtain-slider" min="0" max="100" value="${position}" data-entity="${curtain.entity}" data-reversed="${isReversed}">
            <span class="slider-value">${position}%</span>
          </div>
        </div>
      `;
        }).join('');

        // Attach slider handlers
        container.querySelectorAll('.curtain-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                this._isDragging = true;
                const valueDisplay = slider.closest('.curtain-slider-row').querySelector('.slider-value');
                valueDisplay.textContent = `${e.target.value}%`;
            });
            slider.addEventListener('change', (e) => {
                this._isDragging = false;
                const entity = slider.dataset.entity;
                const isReversed = slider.dataset.reversed === 'true';
                this._setCurtainPosition(entity, parseInt(e.target.value), isReversed);
            });
        });
    }

    _renderMediaPlayers() {
        const container = this.shadowRoot.getElementById('media-players-container');
        if (!container) return;

        container.innerHTML = this._config.media_players.map(player => {
            const state = this._hass.states[player.entity];
            if (!state) return '';

            const isPlaying = state.state === 'playing';
            const isPaused = state.state === 'paused';
            const isActive = isPlaying || isPaused;
            const stateClass = isPlaying ? 'playing' : isPaused ? 'paused' : 'idle';

            const title = state.attributes.media_title || '';
            const artist = state.attributes.media_artist || '';
            const entityPicture = state.attributes.entity_picture || '';
            const volumeLevel = Math.round((state.attributes.volume_level || 0) * 100);
            const isMuted = state.attributes.is_volume_muted || false;
            const playerName = player.name || state.attributes.friendly_name || player.entity;
            const sourceList = state.attributes.source_list || [];
            const currentSource = state.attributes.source || '';
            const shuffle = state.attributes.shuffle || false;
            const repeatMode = state.attributes.repeat || 'off'; // off, all, one

            const volumeIcon = isMuted ? 'mdi:volume-off' : volumeLevel > 50 ? 'mdi:volume-high' : volumeLevel > 0 ? 'mdi:volume-medium' : 'mdi:volume-low';
            const repeatIcon = repeatMode === 'one' ? 'mdi:repeat-once' : 'mdi:repeat';

            if (isActive) {
                return `
            <div class="media-player-item ${stateClass}" data-entity="${player.entity}">
              <div class="media-info">
                <div class="media-art">
                  ${entityPicture ? `<img src="${entityPicture}" alt="">` : `<ha-icon icon="${player.icon || 'mdi:music'}"></ha-icon>`}
                </div>
                <div class="media-details">
                  <span class="media-title">${title || playerName}</span>
                  ${artist ? `<span class="media-artist">${artist}</span>` : ''}
                </div>
              </div>
              <div class="media-controls">
                <button class="media-ctrl-btn small shuffle-btn ${shuffle ? 'active-toggle' : ''}" data-entity="${player.entity}" title="ערבוב">
                  <ha-icon icon="mdi:shuffle${shuffle ? '' : '-disabled'}"></ha-icon>
                </button>
                <button class="media-ctrl-btn prev" data-entity="${player.entity}">
                  <ha-icon icon="mdi:skip-previous"></ha-icon>
                </button>
                <button class="media-ctrl-btn play-pause" data-entity="${player.entity}">
                  <ha-icon icon="${isPlaying ? 'mdi:pause' : 'mdi:play'}"></ha-icon>
                </button>
                <button class="media-ctrl-btn next" data-entity="${player.entity}">
                  <ha-icon icon="mdi:skip-next"></ha-icon>
                </button>
                <button class="media-ctrl-btn small repeat-btn ${repeatMode !== 'off' ? 'active-toggle' : ''}" data-entity="${player.entity}" title="חזרה: ${repeatMode}">
                  <ha-icon icon="${repeatIcon}"></ha-icon>
                </button>
              </div>
              <div class="media-volume-row">
                <ha-icon icon="${volumeIcon}" class="media-volume-icon ${isMuted ? 'muted' : ''}" data-entity="${player.entity}"></ha-icon>
                <input type="range" class="media-volume-slider" min="0" max="100" value="${volumeLevel}" data-entity="${player.entity}">
                <span class="media-volume-value">${volumeLevel}%</span>
              </div>
              ${sourceList.length > 0 ? `
              <div class="media-source-row">
                <ha-icon icon="mdi:speaker-multiple" class="media-source-icon"></ha-icon>
                <select class="media-source-select" data-entity="${player.entity}">
                  ${sourceList.map(src => `<option value="${src}" ${src === currentSource ? 'selected' : ''}>${src}</option>`).join('')}
                </select>
              </div>
              ` : ''}
              <div class="media-extra-controls">
                <button class="media-ctrl-btn small power-inline" data-entity="${player.entity}" title="כיבוי">
                  <ha-icon icon="mdi:power"></ha-icon>
                </button>
              </div>
            </div>`;
            } else {
                return `
            <div class="media-player-item idle" data-entity="${player.entity}">
              <div class="media-info">
                <div class="media-art">
                  <ha-icon icon="${player.icon || 'mdi:speaker'}"></ha-icon>
                </div>
                <div class="media-details">
                  <span class="media-title">${playerName}</span>
                  <span class="media-state-text">${state.state === 'off' ? 'כבוי' : state.state === 'unavailable' ? 'לא זמין' : 'לא פעיל'}</span>
                </div>
              </div>
              ${sourceList.length > 0 ? `
              <div class="media-source-row">
                <ha-icon icon="mdi:speaker-multiple" class="media-source-icon"></ha-icon>
                <select class="media-source-select" data-entity="${player.entity}">
                  <option value="" disabled ${!currentSource ? 'selected' : ''}>בחר מקור...</option>
                  ${sourceList.map(src => `<option value="${src}" ${src === currentSource ? 'selected' : ''}>${src}</option>`).join('')}
                </select>
              </div>
              ` : ''}
              <div class="media-controls">
                <button class="media-ctrl-btn power-btn" data-entity="${player.entity}">
                  <ha-icon icon="mdi:power"></ha-icon>
                </button>
              </div>
            </div>`;
            }
        }).join('');

        // Playback controls
        container.querySelectorAll('.media-ctrl-btn.play-pause').forEach(btn => {
            btn.addEventListener('click', () => {
                this._hass.callService('media_player', 'media_play_pause', { entity_id: btn.dataset.entity });
            });
        });
        container.querySelectorAll('.media-ctrl-btn.prev').forEach(btn => {
            btn.addEventListener('click', () => {
                this._hass.callService('media_player', 'media_previous_track', { entity_id: btn.dataset.entity });
            });
        });
        container.querySelectorAll('.media-ctrl-btn.next').forEach(btn => {
            btn.addEventListener('click', () => {
                this._hass.callService('media_player', 'media_next_track', { entity_id: btn.dataset.entity });
            });
        });

        // Power buttons (both idle and active inline)
        container.querySelectorAll('.media-ctrl-btn.power-btn, .media-ctrl-btn.power-inline').forEach(btn => {
            btn.addEventListener('click', () => {
                const st = this._hass.states[btn.dataset.entity];
                const service = st?.state === 'off' ? 'turn_on' : 'turn_off';
                this._hass.callService('media_player', service, { entity_id: btn.dataset.entity });
            });
        });

        // Shuffle toggle
        container.querySelectorAll('.media-ctrl-btn.shuffle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const st = this._hass.states[btn.dataset.entity];
                const currentShuffle = st?.attributes?.shuffle || false;
                this._hass.callService('media_player', 'shuffle_set', { entity_id: btn.dataset.entity, shuffle: !currentShuffle });
            });
        });

        // Repeat toggle (cycles: off -> all -> one -> off)
        container.querySelectorAll('.media-ctrl-btn.repeat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const st = this._hass.states[btn.dataset.entity];
                const currentRepeat = st?.attributes?.repeat || 'off';
                const nextRepeat = currentRepeat === 'off' ? 'all' : currentRepeat === 'all' ? 'one' : 'off';
                this._hass.callService('media_player', 'repeat_set', { entity_id: btn.dataset.entity, repeat: nextRepeat });
            });
        });

        // Source selector
        container.querySelectorAll('.media-source-select').forEach(select => {
            select.addEventListener('change', (e) => {
                this._hass.callService('media_player', 'select_source', {
                    entity_id: select.dataset.entity,
                    source: e.target.value
                });
            });
        });

        // Volume mute toggle
        container.querySelectorAll('.media-volume-icon').forEach(icon => {
            icon.addEventListener('click', () => {
                const st = this._hass.states[icon.dataset.entity];
                const isMuted = st?.attributes?.is_volume_muted || false;
                this._hass.callService('media_player', 'volume_mute', { entity_id: icon.dataset.entity, is_volume_muted: !isMuted });
            });
        });

        // Volume slider
        container.querySelectorAll('.media-volume-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                this._isDraggingVolume = true;
                const valueDisplay = slider.closest('.media-volume-row').querySelector('.media-volume-value');
                valueDisplay.textContent = `${e.target.value}%`;
            });
            slider.addEventListener('change', (e) => {
                this._isDraggingVolume = false;
                this._hass.callService('media_player', 'volume_set', {
                    entity_id: slider.dataset.entity,
                    volume_level: parseInt(e.target.value) / 100
                });
            });
        });
    }

    _hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 102, g: 126, b: 234 };
    }

    _darkenHex(hex, factor = 0.25) {
        const { r, g, b } = this._hexToRgb(hex);
        return `rgb(${Math.max(0, Math.round(r * (1 - factor)))}, ${Math.max(0, Math.round(g * (1 - factor)))}, ${Math.max(0, Math.round(b * (1 - factor)))})`;
    }

    _getCurtainVisualState(state, isReversed) {
        if (!state) {
            return { stateClass: 'closed', stateText: 'לא זמין', icon: 'mdi:blinds-horizontal-closed', position: 0 };
        }

        let position = state.attributes?.current_position;
        let stateValue = state.state;

        // Handle reversed logic for display
        if (isReversed) {
            if (position !== undefined) {
                position = 100 - position;
            }
            if (stateValue === 'open') stateValue = 'closed';
            else if (stateValue === 'closed') stateValue = 'open';
        }

        // Determine visual state
        if (position !== undefined) {
            const displayPos = Math.round(position);
            if (position >= 90) {
                return { stateClass: 'open', stateText: 'פתוח', icon: 'mdi:curtains', position: displayPos };
            }
            if (position <= 10) {
                return { stateClass: 'closed', stateText: 'סגור', icon: 'mdi:blinds-horizontal-closed', position: displayPos };
            }
            return { stateClass: 'partial', stateText: `${displayPos}% פתוח`, icon: 'mdi:blinds', position: displayPos };
        }

        switch (stateValue) {
            case 'open':
                return { stateClass: 'open', stateText: 'פתוח', icon: 'mdi:curtains', position: 100 };
            case 'closed':
                return { stateClass: 'closed', stateText: 'סגור', icon: 'mdi:blinds-horizontal-closed', position: 0 };
            case 'opening':
                return { stateClass: 'partial', stateText: 'נפתח...', icon: 'mdi:blinds', position: 50 };
            case 'closing':
                return { stateClass: 'partial', stateText: 'נסגר...', icon: 'mdi:blinds', position: 50 };
            default:
                return { stateClass: 'closed', stateText: stateValue, icon: 'mdi:blinds-horizontal-closed', position: 0 };
        }
    }

    _toggleEntity(entityId) {
        const domain = entityId.split('.')[0];
        this._hass.callService(domain, 'toggle', { entity_id: entityId });
    }

    _setCurtainPosition(entityId, displayPosition, isReversed = false) {
        const actualPosition = isReversed ? 100 - displayPosition : displayPosition;
        this._hass.callService('cover', 'set_cover_position', {
            entity_id: entityId,
            position: actualPosition
        });
    }

    async _openAllCurtains() {
        const btn = this.shadowRoot.getElementById('btn-open-curtains');
        btn?.classList.add('loading');

        for (const curtain of this._config.curtains) {
            if (curtain.exclude_from_actions) continue;
            const isReversed = curtain.reversed === true;
            const position = isReversed ? 0 : 100;
            this._hass.callService('cover', 'set_cover_position', { entity_id: curtain.entity, position });
            await this._delay(this._actionDelay);
        }

        btn?.classList.remove('loading');
    }

    async _closeAllCurtains() {
        const btn = this.shadowRoot.getElementById('btn-close-curtains');
        btn?.classList.add('loading');

        for (const curtain of this._config.curtains) {
            if (curtain.exclude_from_actions) continue;
            const isReversed = curtain.reversed === true;
            const position = isReversed ? 100 : 0;
            this._hass.callService('cover', 'set_cover_position', { entity_id: curtain.entity, position });
            await this._delay(this._actionDelay);
        }

        btn?.classList.remove('loading');
    }

    async _turnOnAllLights() {
        const btn = this.shadowRoot.getElementById('btn-lights-on');
        btn?.classList.add('loading');

        for (const light of this._config.lights) {
            if (light.exclude_from_actions) continue;
            const domain = light.entity.split('.')[0];
            this._hass.callService(domain, 'turn_on', { entity_id: light.entity });
            await this._delay(this._actionDelay);
        }

        btn?.classList.remove('loading');
    }

    async _turnOffEverything() {
        const btn = this.shadowRoot.getElementById('btn-turn-off');
        btn?.classList.add('loading');

        // Turn off all lights with delay (skip excluded)
        for (const light of this._config.lights) {
            if (light.exclude_from_actions) continue;
            const domain = light.entity.split('.')[0];
            this._hass.callService(domain, 'turn_off', { entity_id: light.entity });
            await this._delay(this._actionDelay);
        }

        // Close all curtains with delay (skip excluded)
        for (const curtain of this._config.curtains) {
            if (curtain.exclude_from_actions) continue;
            const isReversed = curtain.reversed === true;
            const position = isReversed ? 100 : 0;
            this._hass.callService('cover', 'set_cover_position', { entity_id: curtain.entity, position });
            await this._delay(this._actionDelay);
        }

        btn?.classList.remove('loading');
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static getConfigElement() {
        return document.createElement('yangc-editor');
    }

    static getStubConfig() {
        return {
            title: 'פינת אוכל',
            icon: 'mdi:food',
            lights: [
                { entity: 'switch.example_light', name: 'תאורה', icon: 'mdi:ceiling-light' }
            ],
            curtains: [
                { entity: 'cover.example_curtain', name: 'וילון', reversed: false }
            ],
            media_players: [
                { entity: 'media_player.example', name: 'רמקול', icon: 'mdi:speaker' }
            ]
        };
    }
}

customElements.define('yangc-card', YangcCard);

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'yangc-card',
    name: 'Yet Another Nice Generic Card',
    description: 'A beautiful card for controlling room lights, AC, curtains, and media players',
    preview: true,
    documentationURL: 'https://github.com/LiadRB/yet-another-nice-generic-card'
});

} // end if (!customElements.get('yangc-card'))

console.info(
    '%c YANGC %c Loaded ',
    'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;',
    'background: #333; color: white; padding: 2px 6px; border-radius: 0 4px 4px 0;'
);
