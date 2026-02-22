import styles from './IsometricCube.module.css';

interface IsometricCubeProps {
  puzzle3DCells: (number | null)[];   // 64 elements
  userValues: (number | null)[];      // 64 elements
  activeLayer: number;
  onLayerClick: (layer: number) => void;
}

// Isometric projection constants
// We draw slabs stacked top to bottom (layer 0 = top, layer 3 = bottom)
// Each slab: a parallelogram (isometric top face) with a 4×4 grid of dots

const SVG_W = 240;
const SVG_H = 220;

// Isometric unit vectors
const IX = 28;   // x-component of right-step
const IY = 14;   // y-component of right-step (positive = down)
const JX = -28;  // x-component of down-step
const JY = 14;   // y-component of down-step
const LAYER_STEP_Y = 34; // vertical gap between slabs

// Origin for the top-left corner of the topmost slab
const ORIGIN_X = SVG_W / 2;
const ORIGIN_Y = 28;

function slabOrigin(layer: number): [number, number] {
  return [ORIGIN_X, ORIGIN_Y + layer * LAYER_STEP_Y];
}

function cellCenter(layer: number, row: number, col: number): [number, number] {
  const [ox, oy] = slabOrigin(layer);
  // Move col steps in I direction and row steps in J direction, then center in cell
  const x = ox + col * IX + row * JX + (IX + JX) / 2;
  const y = oy + col * IY + row * JY + (IY + JY) / 2;
  return [x, y];
}

function slabPath(layer: number): string {
  const [ox, oy] = slabOrigin(layer);
  // 4 corners of the parallelogram top face
  // top-left, top-right, bottom-right, bottom-left
  const tl = [ox, oy];
  const tr = [ox + 4 * IX, oy + 4 * IY];
  const br = [ox + 4 * IX + 4 * JX, oy + 4 * IY + 4 * JY];
  const bl = [ox + 4 * JX, oy + 4 * JY];
  return `M${tl[0]},${tl[1]} L${tr[0]},${tr[1]} L${br[0]},${br[1]} L${bl[0]},${bl[1]} Z`;
}

function cellPath(layer: number, row: number, col: number): string {
  const [ox, oy] = slabOrigin(layer);
  const tlx = ox + col * IX + row * JX;
  const tly = oy + col * IY + row * JY;
  const trx = tlx + IX;
  const tr_y = tly + IY;
  const brx = tlx + IX + JX;
  const bry = tly + IY + JY;
  const blx = tlx + JX;
  const bly = tly + JY;
  return `M${tlx},${tly} L${trx},${tr_y} L${brx},${bry} L${blx},${bly} Z`;
}

// Accent colors for filled cells per layer
const LAYER_COLORS = ['#4a90d9', '#5ba85c', '#e07b39', '#9b59b6'];
const LAYER_COLORS_LIGHT = ['#bbdefb', '#c8e6c9', '#ffe0b2', '#e1bee7'];

export function IsometricCube({ puzzle3DCells, userValues, activeLayer, onLayerClick }: IsometricCubeProps) {
  return (
    <div className={styles.container}>
      <svg
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className={styles.svg}
        aria-label="3D Sudoku cube overview"
      >
        {/* Draw layers from bottom to top so upper layers render on top */}
        {[3, 2, 1, 0].map(layer => {
          const isActive = layer === activeLayer;
          const baseColor = isActive ? LAYER_COLORS_LIGHT[layer] : '#f5f5f5';
          const strokeColor = isActive ? LAYER_COLORS[layer] : '#bbb';
          const strokeWidth = isActive ? 2 : 1;
          const opacity = isActive ? 1 : 0.65;

          return (
            <g
              key={layer}
              onClick={() => onLayerClick(layer)}
              className={styles.slab}
              style={{ cursor: 'pointer', opacity }}
            >
              {/* Slab background */}
              <path
                d={slabPath(layer)}
                fill={baseColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                className={isActive ? styles.activeSlab : ''}
              />

              {/* Cell fills for filled cells */}
              {Array.from({ length: 16 }, (_, i) => {
                const row = Math.floor(i / 4);
                const col = i % 4;
                const flatIdx = layer * 16 + i;
                const val = puzzle3DCells[flatIdx] ?? userValues[flatIdx];
                if (val === null) return null;

                return (
                  <path
                    key={i}
                    d={cellPath(layer, row, col)}
                    fill={LAYER_COLORS[layer]}
                    opacity={0.7}
                  />
                );
              })}

              {/* Slab border lines (grid lines within slab) */}
              {[0, 1, 2, 3, 4].map(i => {
                const [ox, oy] = slabOrigin(layer);
                // Horizontal lines (parallel to I)
                const hx1 = ox + i * JX;
                const hy1 = oy + i * JY;
                const hx2 = hx1 + 4 * IX;
                const hy2 = hy1 + 4 * IY;
                // Vertical lines (parallel to J)
                const vx1 = ox + i * IX;
                const vy1 = oy + i * IY;
                const vx2 = vx1 + 4 * JX;
                const vy2 = vy1 + 4 * JY;

                const isBold = i === 0 || i === 2 || i === 4;
                return (
                  <g key={i}>
                    <line x1={hx1} y1={hy1} x2={hx2} y2={hy2}
                      stroke={strokeColor} strokeWidth={isBold ? 1.5 : 0.5} opacity={0.6} />
                    <line x1={vx1} y1={vy1} x2={vx2} y2={vy2}
                      stroke={strokeColor} strokeWidth={isBold ? 1.5 : 0.5} opacity={0.6} />
                  </g>
                );
              })}

              {/* Layer label */}
              {(() => {
                const [cx, cy] = cellCenter(layer, 1.5, 1.5);
                return (
                  <text
                    x={cx}
                    y={cy + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={isActive ? 11 : 9}
                    fontWeight={isActive ? 'bold' : 'normal'}
                    fill={isActive ? LAYER_COLORS[layer] : '#888'}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    L{layer + 1}
                  </text>
                );
              })()}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
