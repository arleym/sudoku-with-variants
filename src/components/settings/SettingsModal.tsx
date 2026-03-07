import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Toggle } from '../ui/Toggle';
import type { GameSettings, ColorMode } from '../../types/settings';
import { APP_VERSION } from '../../constants/version';
import styles from './SettingsModal.module.css';

export type SettingsTab = 'settings' | 'appearance' | 'info';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onToggle: (key: keyof GameSettings) => void;
  onColorModeChange: (mode: ColorMode) => void;
  initialTab?: SettingsTab;
}

const SETTINGS_CONFIG: {
  key: keyof GameSettings;
  label: string;
  description: string;
}[] = [
  {
    key: 'showPencilMarks',
    label: 'Show Pencil Marks',
    description: 'Display pencil marks (candidates) in cells',
  },
  {
    key: 'autoFillCandidates',
    label: 'Auto-fill Candidates',
    description: 'Automatically show all valid candidates',
  },
  {
    key: 'autoCleanPencilMarks',
    label: 'Auto-clean Pencil Marks',
    description: 'Remove impossible candidates from pencil marks',
  },
  {
    key: 'showErrors',
    label: 'Show Errors',
    description: 'Highlight conflicting numbers',
  },
  {
    key: 'highlightSameNumbers',
    label: 'Highlight Same Numbers',
    description: 'Highlight cells with the same value',
  },
  {
    key: 'highlightRowColBox',
    label: 'Highlight Row/Col/Box',
    description: 'Highlight related cells when selecting',
  },
  {
    key: 'showHints',
    label: 'Enable Hints',
    description: 'Show hint button for solving help',
  },
  {
    key: 'showNumberPad',
    label: 'Show Number Pad',
    description: 'Display number buttons for input',
  },
];

const COLOR_MODES: { value: ColorMode; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Clean light theme' },
  { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
  { value: 'system', label: 'System', description: 'Match your device setting' },
  { value: 'autumn-light', label: 'Autumn Light', description: 'Warm beige and earth tones' },
  { value: 'autumn-dark', label: 'Autumn Dark', description: 'Rich browns and amber' },
  { value: 'nord', label: 'Nord', description: 'Arctic navy color palette' },
];

type Tab = SettingsTab;

const TAB_TITLES: Record<Tab, string> = {
  settings: 'Settings',
  appearance: 'Appearance',
  info: 'Info',
};

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onToggle,
  onColorModeChange,
  initialTab = 'settings',
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Sync tab when initialTab changes (e.g. opened from menu)
  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={TAB_TITLES[activeTab]}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'settings' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'appearance' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          Appearance
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'info' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Info
        </button>
      </div>

      {activeTab === 'settings' ? (
        <div className={styles.settings}>
          {SETTINGS_CONFIG.map(({ key, label, description }) => (
            <div key={key} className={styles.setting}>
              <Toggle
                id={`setting-${key}`}
                label={label}
                checked={settings[key] as boolean}
                onChange={() => onToggle(key)}
              />
              <p className={styles.description}>{description}</p>
            </div>
          ))}
        </div>
      ) : activeTab === 'appearance' ? (
        <div className={styles.colorModes}>
          {COLOR_MODES.map(({ value, label, description }) => (
            <button
              key={value}
              className={`${styles.colorModeOption} ${settings.colorMode === value ? styles.colorModeActive : ''}`}
              onClick={() => onColorModeChange(value)}
            >
              <div className={`${styles.colorModePreview} ${styles[`preview_${value}`]}`} />
              <div className={styles.colorModeInfo}>
                <span className={styles.colorModeLabel}>{label}</span>
                <span className={styles.colorModeDesc}>{description}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.info}>
          <section className={styles.infoSection}>
            <h3>Add to Home Screen</h3>
            <div className={styles.instructions}>
              <div className={styles.platform}>
                <strong>iOS (Safari)</strong>
                <ol>
                  <li>Tap the Share button (square with arrow)</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
              </div>
              <div className={styles.platform}>
                <strong>Android (Chrome)</strong>
                <ol>
                  <li>Tap the menu button (three dots)</li>
                  <li>Tap "Add to Home screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
              </div>
              <div className={styles.platform}>
                <strong>Desktop (Chrome/Edge)</strong>
                <ol>
                  <li>Click the install icon in the address bar</li>
                  <li>Or use menu: "Install Morrison Sudoku"</li>
                </ol>
              </div>
            </div>
            <p className={styles.note}>
              Once installed, the app works offline and launches like a native app.
            </p>
          </section>

          <section className={styles.infoSection}>
            <h3>About</h3>
            <p>Morrison Sudoku supports 4x4, 9x9, 16x16, and 25x25 puzzles with multiple difficulty levels.</p>
          </section>

          <div className={styles.version}>
            Version {APP_VERSION}
          </div>
        </div>
      )}
    </Modal>
  );
}
