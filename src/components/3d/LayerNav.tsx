import styles from './LayerNav.module.css';

interface LayerNavProps {
  depth: number;          // number of layers (4 or 9)
  activeLayer: number;
  onChangeLayer: (layer: number) => void;
}

export function LayerNav({ depth, activeLayer, onChangeLayer }: LayerNavProps) {
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
        <span className={styles.label}>Layer {activeLayer + 1} / {depth}</span>
        <div className={`${styles.dots} ${depth > 4 ? styles.dotsSmall : ''}`}>
          {Array.from({ length: depth }, (_, i) => (
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
        onClick={() => onChangeLayer(Math.min(depth - 1, activeLayer + 1))}
        disabled={activeLayer === depth - 1}
        aria-label="Next layer"
      >
        ›
      </button>
    </div>
  );
}
