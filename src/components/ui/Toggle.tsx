import styles from './Toggle.module.css';

interface ToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ id, label, checked, onChange }: ToggleProps) {
  return (
    <label htmlFor={id} className={styles.toggle}>
      <span className={styles.label}>{label}</span>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className={styles.input}
      />
      <span className={styles.switch} aria-hidden="true" />
    </label>
  );
}
