import styles from './IsometricCube.module.css';

interface IsometricCubeProps {
  size: number;                       // 4 or 9
  depth: number;                      // 4 or 9
  puzzle3DCells: (number | null)[];
  userValues: (number | null)[];
  activeLayer: number;
  onLayerClick: (layer: number) => void;
}

// Accent colors per layer (cycles for > 9 layers)
const LAYER_COLORS = [
  '#4a90d9', '#5ba85c', '#e07b39', '#9b59b6',
  '#e74c3c', '#1abc9c', '#f39c12', '#8e44ad', '#2980b9',
  '#d35400', '#27ae60', '#c0392b', '#2c3e50', '#16a085', '#8e44ad', '#2ecc71',
];
const LAYER_COLORS_LIGHT = [
  '#bbdefb', '#c8e6c9', '#ffe0b2', '#e1bee7',
  '#ffcdd2', '#b2dfdb', '#fff9c4', '#e8daef', '#d6eaf8',
  '#fdebd0', '#d5f5e3', '#fadbd8', '#d5d8dc', '#d1f2eb', '#e8daef', '#d5f5e3',
];

function getIsoParams(size: number, depth: number) {
  const SVG_W = 240;
  // Cell step in screen units: fit (size cols + size rows) into SVG_W with margin
  const IX = Math.max(8, Math.floor(110 / size));
  const IY = Math.floor(IX / 2);
  const JX = -IX;
  const JY = IY;
  // Layer vertical spacing shrinks for many layers
  const LAYER_STEP_Y = depth <= 4 ? 34 : 18;
  const ORIGIN_X = SVG_W / 2;
  const ORIGIN_Y = 20;
  const SVG_H = ORIGIN_Y + depth * LAYER_STEP_Y + size * IY + 16;
  return { SVG_W, SVG_H, IX, IY, JX, JY, LAYER_STEP_Y, ORIGIN_X, ORIGIN_Y };
}

function slabOrigin(layer: number, p: ReturnType<typeof getIsoParams>): [number, number] {
  return [p.ORIGIN_X, p.ORIGIN_Y + layer * p.LAYER_STEP_Y];
}

function slabPath(layer: number, size: number, p: ReturnType<typeof getIsoParams>): string {
  const [ox, oy] = slabOrigin(layer, p);
  const tl = [ox, oy];
  const tr = [ox + size * p.IX, oy + size * p.IY];
  const br = [ox + size * p.IX + size * p.JX, oy + size * p.IY + size * p.JY];
  const bl = [ox + size * p.JX, oy + size * p.JY];
  return `M${tl[0]},${tl[1]} L${tr[0]},${tr[1]} L${br[0]},${br[1]} L${bl[0]},${bl[1]} Z`;
}

function cellPath(layer: number, row: number, col: number, p: ReturnType<typeof getIsoParams>): string {
  const [ox, oy] = slabOrigin(layer, p);
  const tlx = ox + col * p.IX + row * p.JX;
  const tly = oy + col * p.IY + row * p.JY;
  return [
    `M${tlx},${tly}`,
    `L${tlx + p.IX},${tly + p.IY}`,
    `L${tlx + p.IX + p.JX},${tly + p.IY + p.JY}`,
    `L${tlx + p.JX},${tly + p.JY}`,
    'Z',
  ].join(' ');
}

function slabCenter(layer: number, size: number, p: ReturnType<typeof getIsoParams>): [number, number] {
  const [ox, oy] = slabOrigin(layer, p);
  const halfSteps = (size - 1) / 2;
  const cx = ox + halfSteps * p.IX + halfSteps * p.JX + (p.IX + p.JX) / 2;
  const cy = oy + halfSteps * p.IY + halfSteps * p.JY + (p.IY + p.JY) / 2;
  return [cx, cy];
}

// For large sizes, only show filled-cell markers for a small sample to keep SVG fast
const MAX_DOTS = 81;

export function IsometricCube({ size, depth, puzzle3DCells, userValues, activeLayer, onLayerClick }: IsometricCubeProps) {
  const p = getIsoParams(size, depth);
  const layerSize = size * size;
  // Box lines at multiples of boxSize
  const boxSize = Math.sqrt(size);
  const gridLines = Array.from({ length: size + 1 }, (_, i) => i);

  return (
    <div className={styles.container}>
      <svg
        width={p.SVG_W}
        height={p.SVG_H}
        viewBox={`0 0 ${p.SVG_W} ${p.SVG_H}`}
        className={styles.svg}
        aria-label="3D Sudoku cube overview"
      >
        {/* Draw layers bottom-to-top so upper layers paint over lower */}
        {Array.from({ length: depth }, (_, i) => depth - 1 - i).map(layer => {
          const isActive = layer === activeLayer;
          const baseColor = isActive ? LAYER_COLORS_LIGHT[layer % LAYER_COLORS_LIGHT.length] : '#f0f0f0';
          const strokeColor = isActive ? LAYER_COLORS[layer % LAYER_COLORS.length] : '#bbb';
          const opacity = isActive ? 1 : 0.6;

          // Collect filled cells for this layer (cap at MAX_DOTS for large grids)
          const filledCells: number[] = [];
          for (let i = 0; i < layerSize && filledCells.length < MAX_DOTS; i++) {
            const flatIdx = layer * layerSize + i;
            if ((puzzle3DCells[flatIdx] ?? userValues[flatIdx]) !== null) {
              filledCells.push(i);
            }
          }

          const [cx, cy] = slabCenter(layer, size, p);

          return (
            <g
              key={layer}
              onClick={() => onLayerClick(layer)}
              className={styles.slab}
              style={{ cursor: 'pointer', opacity }}
            >
              {/* Slab background */}
              <path
                d={slabPath(layer, size, p)}
                fill={baseColor}
                stroke={strokeColor}
                strokeWidth={isActive ? 1.5 : 0.8}
                className={isActive ? styles.activeSlab : ''}
              />

              {/* Filled cell indicators */}
              {filledCells.map(i => {
                const row = Math.floor(i / size);
                const col = i % size;
                return (
                  <path
                    key={i}
                    d={cellPath(layer, row, col, p)}
                    fill={LAYER_COLORS[layer % LAYER_COLORS.length]}
                    opacity={0.65}
                  />
                );
              })}

              {/* Grid lines */}
              {gridLines.map(i => {
                const [ox, oy] = slabOrigin(layer, p);
                const isBold = i % boxSize === 0;
                return (
                  <g key={i}>
                    <line
                      x1={ox + i * p.JX} y1={oy + i * p.JY}
                      x2={ox + i * p.JX + size * p.IX} y2={oy + i * p.JY + size * p.IY}
                      stroke={strokeColor} strokeWidth={isBold ? 1.2 : 0.4} opacity={0.5}
                    />
                    <line
                      x1={ox + i * p.IX} y1={oy + i * p.IY}
                      x2={ox + i * p.IX + size * p.JX} y2={oy + i * p.IY + size * p.JY}
                      stroke={strokeColor} strokeWidth={isBold ? 1.2 : 0.4} opacity={0.5}
                    />
                  </g>
                );
              })}

              {/* Layer label */}
              <text
                x={cx} y={cy + 1}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={isActive ? Math.max(8, p.IX - 2) : Math.max(7, p.IX - 4)}
                fontWeight={isActive ? 'bold' : 'normal'}
                fill={isActive ? LAYER_COLORS[layer % LAYER_COLORS.length] : '#999'}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                L{layer + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
