import styles from './LayerNav.module.css';

interface LayerNavProps {
  activeLayer: number;
  onChangeLayer: (layer: number) => void;
}

export function LayerNav({ activeLayer, onChangeLayer }: LayerNavProps) {
  return (
    <div className={styles.nav}>
      <button
        className={styles.arrow}
        onClick={() => onChangeLayer(Math.max(0, activeLayer - 1))}
        disabled={activeLayer === 0}
        aria-label="Previous layer"
      >
        ‹
      </button>

      <div className={styles.info}>
        <span className={styles.label}>Layer {activeLayer + 1} / 4</span>
        <div className={styles.dots}>
          {[0, 1, 2, 3].map(i => (
            <button
              key={i}
              className={`${styles.dot} ${i === activeLayer ? styles.dotActive : ''}`}
              onClick={() => onChangeLayer(i)}
              aria-label={`Go to layer ${i + 1}`}
              aria-current={i === activeLayer ? 'true' : undefined}
            />
          ))}
        </div>
      </div>

      <button
        className={styles.arrow}
        onClick={() => onChangeLayer(Math.min(3, activeLayer + 1))}
        disabled={activeLayer === 3}
        aria-label="Next layer"
      >
        ›
      </button>
    </div>
  );
}
