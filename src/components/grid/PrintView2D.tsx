// Print-only view of a 2D Sudoku puzzle.
// Visibility is controlled by global CSS in globals.css:
//   @media screen  → .print2d-root { display: none }
//   @media print   → .print2d-root { display: block !important }

import type { GridSize } from '../../types/puzzle';
import { getGridConfig, displayValue } from '../../constants/grid-configs';

// Physical grid dimensions by size (inches)
const GRID_SIZE_IN: Record<GridSize, number> = { 4: 3, 9: 6.5, 16: 7, 25: 7.5 };
const FONT_SIZE_PT: Record<GridSize, string> = { 4: '22pt', 9: '16pt', 16: '9pt', 25: '6pt' };
const PENCIL_FONT_PT: Record<GridSize, string> = { 4: '7pt', 9: '5pt', 16: '4pt', 25: '3pt' };

interface PrintView2DProps {
  size: GridSize;
  difficulty: string;
  puzzleCells: (number | null)[];
  userValues: (number | null)[];
  pencilMarks: Set<number>[];
}

export function PrintView2D({ size, difficulty, puzzleCells, userValues, pencilMarks }: PrintView2DProps) {
  const config = getGridConfig(size);
  const { boxConfig } = config;
  const totalCells = size * size;
  const boxSize = Math.sqrt(size); // for pencil grid columns

  const gridIn = GRID_SIZE_IN[size];
  const fontSize = FONT_SIZE_PT[size];
  const pencilFontSize = PENCIL_FONT_PT[size];

  // Legend entries for sizes > 9: value → letter
  const legendEntries =
    size > 9
      ? Array.from({ length: size - 9 }, (_, i) => ({
          num: i + 10,
          letter: String.fromCharCode('A'.charCodeAt(0) + i),
        }))
      : [];

  const puzzleLabel = `${size}×${size} · ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;

  return (
    <div className="print2d-root">
      <div className="print2d-page">
        <div className="print2d-title">{puzzleLabel}</div>
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
          {Array.from({ length: totalCells }, (_, i) => {
            const row = Math.floor(i / size);
            const col = i % size;

            const puzzleVal = puzzleCells[i];
            const userVal = userValues[i];
            const displayVal = puzzleVal ?? userVal;
            const isGiven = puzzleVal !== null;
            const marks = pencilMarks[i];

            const isBoxBorderRight = col < size - 1 && (col + 1) % boxConfig.cols === 0;
            const isBoxBorderBottom = row < size - 1 && (row + 1) % boxConfig.rows === 0;

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
                  <span>{displayValue(displayVal, size)}</span>
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
                        {marks.has(n) ? displayValue(n, size) : ''}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {legendEntries.length > 0 && (
          <div className="print2d-legend">
            <span className="print2d-legend-label">
              Letters represent values 10–{size}:
            </span>
            {legendEntries.map(({ num, letter }) => (
              <span key={num}>
                {num}={letter}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
