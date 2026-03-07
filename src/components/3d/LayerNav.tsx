import styles from './LayerNav.module.css';

interface LayerNavProps {
  depth: number;
  activeLayer: number;
  onChangeLayer: (layer: number) => void;
  showCube: boolean;
  onToggleCube: () => void;
}

export function LayerNav({ depth, activeLayer, onChangeLayer, showCube, onToggleCube }: LayerNavProps) {
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
        <button
          className={styles.layerToggle}
          onClick={onToggleCube}
          aria-label={showCube ? 'Hide 3D overview' : 'Show 3D overview'}
          title={showCube ? 'Hide 3D overview' : 'Show 3D overview'}
        >
          <span className={styles.label}>Layer {activeLayer + 1} / {depth}</span>
          <span className={styles.toggleHint}>{showCube ? '▲' : '▼'}</span>
        </button>
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
