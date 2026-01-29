import { Modal } from '../ui/Modal';
import { Toggle } from '../ui/Toggle';
import type { GameSettings } from '../../types/settings';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onToggle: (key: keyof GameSettings) => void;
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
];

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onToggle,
}: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className={styles.settings}>
        {SETTINGS_CONFIG.map(({ key, label, description }) => (
          <div key={key} className={styles.setting}>
            <Toggle
              id={`setting-${key}`}
              label={label}
              checked={settings[key]}
              onChange={() => onToggle(key)}
            />
            <p className={styles.description}>{description}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}
