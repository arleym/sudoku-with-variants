import { useState, useRef, useEffect } from 'react';
import styles from './TitleBar.module.css';

export type MenuAction = 'settings' | 'appearance' | 'info' | 'share' | 'print' | 'privacy';

interface TitleBarProps {
  onMenuAction: (action: MenuAction) => void;
}

const MENU_ITEMS: { action: MenuAction; label: string }[] = [
  { action: 'settings', label: 'Settings' },
  { action: 'appearance', label: 'Appearance' },
  { action: 'info', label: 'Info' },
  { action: 'share', label: 'Share' },
  { action: 'print', label: 'Print' },
  { action: 'privacy', label: 'Privacy Policy' },
];

export function TitleBar({ onMenuAction }: TitleBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <header className={styles.titleBar}>
      <span className={styles.title}>Morrison Sudoku</span>
      <div className={styles.menuWrapper} ref={menuRef}>
        <button
          className={styles.menuButton}
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="10" cy="4" r="1.5" />
            <circle cx="10" cy="10" r="1.5" />
            <circle cx="10" cy="16" r="1.5" />
          </svg>
        </button>
        {menuOpen && (
          <div className={styles.menu}>
            {MENU_ITEMS.map(({ action, label }) => (
              <button
                key={action}
                className={styles.menuItem}
                onClick={() => {
                  setMenuOpen(false);
                  onMenuAction(action);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
