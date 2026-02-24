// Print-only view of a 3D Sudoku puzzle.
// Visibility is controlled by global CSS in globals.css:
//   @media screen  → .print3d-root { display: none }
//   @media print   → .print3d-root { display: block !important }

function getLayerLabel(layer: number, depth: number): string {
  if (layer === 0) return `Layer 1 — Top`;
  if (layer === depth - 1) return `Layer ${depth} — Bottom`;
  return `Layer ${layer + 1}`;
}

interface PrintGridProps {
  size: number;
  layer: number;
  depth: number;
  puzzleCells: (number | null)[];
  userValues: (number | null)[];
  pencilMarks: Set<number>[];
}

function PrintGrid({ size, layer, depth, puzzleCells, userValues, pencilMarks }: PrintGridProps) {
  const layerSize = size * size;
  const boxSize = Math.sqrt(size);

  // Physical grid dimensions: 4×4 → 3in, 9×9 → 6in
  const gridIn = size === 4 ? 3 : 6;
  const fontSize = size === 4 ? '22pt' : '14pt';
  const pencilFontSize = size === 4 ? '7pt' : '5pt';

  return (
    <div className="print-layer-block">
      <div className="print-layer-title">{getLayerLabel(layer, depth)}</div>
      <div
        className="print-grid"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
          width: `${gridIn}in`,
          height: `${gridIn}in`,
          fontSize,
        }}
      >
        {Array.from({ length: layerSize }, (_, i) => {
          const row = Math.floor(i / size);
          const col = i % size;
          const flatIdx = layer * layerSize + i;

          const puzzleVal = puzzleCells[flatIdx];
          const userVal = userValues[flatIdx];
          const displayVal = puzzleVal ?? userVal;
          const isGiven = puzzleVal !== null;
          const marks = pencilMarks[flatIdx];

          const isBoxBorderRight = col < size - 1 && (col + 1) % boxSize === 0;
          const isBoxBorderBottom = row < size - 1 && (row + 1) % boxSize === 0;

          const cellClass = [
            'print-cell',
            isGiven ? 'print-cell-given' : null,
            isBoxBorderRight ? 'print-cell-box-right' : null,
            isBoxBorderBottom ? 'print-cell-box-bottom' : null,
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={i} className={cellClass}>
              {displayVal !== null ? (
                <span>{displayVal}</span>
              ) : marks && marks.size > 0 ? (
                <div
                  className="print-pencil"
                  style={{ gridTemplateColumns: `repeat(${boxSize}, 1fr)` }}
                >
                  {Array.from({ length: size }, (_, n) => n + 1).map((n) => (
                    <span
                      key={n}
                      className="print-pencil-mark"
                      style={{ fontSize: pencilFontSize }}
                    >
                      {marks.has(n) ? n : ''}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PrintView3DProps {
  size: number;
  depth: number;
  puzzleCells: (number | null)[];
  userValues: (number | null)[];
  pencilMarks: Set<number>[];
}

export function PrintView3D({
  size,
  depth,
  puzzleCells,
  userValues,
  pencilMarks,
}: PrintView3DProps) {
  const layers = Array.from({ length: depth }, (_, i) => i);

  if (size === 4) {
    // All 4 layers in a 2×2 grid on one page
    return (
      <div className="print3d-root">
        <div className="print3d-layers4">
          {layers.map((layer) => (
            <PrintGrid
              key={layer}
              size={size}
              layer={layer}
              depth={depth}
              puzzleCells={puzzleCells}
              userValues={userValues}
              pencilMarks={pencilMarks}
            />
          ))}
        </div>
      </div>
    );
  }

  // 9×9: one layer per page, same layout each page for staple alignment
  return (
    <div className="print3d-root">
      {layers.map((layer) => (
        <div key={layer} className="print3d-page">
          <PrintGrid
            size={size}
            layer={layer}
            depth={depth}
            puzzleCells={puzzleCells}
            userValues={userValues}
            pencilMarks={pencilMarks}
          />
        </div>
      ))}
    </div>
  );
}
