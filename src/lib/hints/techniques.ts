import type { GridSize } from '../../types/puzzle';
import { getCandidates } from '../candidates';
import { getCellPosition, getGridConfig } from '../../constants/grid-configs';

export type TechniqueType = 'naked_single' | 'hidden_single' | 'naked_pair';

export interface Hint {
  type: TechniqueType;
  cellIndex: number;
  value: number;
  description: string;
  relatedCells?: number[];
}

export function findNakedSingle(
  cells: (number | null)[],
  size: GridSize
): Hint | null {
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== null) continue;

    const candidates = getCandidates(cells, i, size);
    if (candidates.size === 1) {
      const value = [...candidates][0];
      const { row, col } = getCellPosition(i, size);

      return {
        type: 'naked_single',
        cellIndex: i,
        value,
        description: `Cell R${row + 1}C${col + 1} can only be ${value} (Naked Single)`,
      };
    }
  }

  return null;
}

export function findHiddenSingle(
  cells: (number | null)[],
  size: GridSize
): Hint | null {
  const { boxConfig } = getGridConfig(size);

  // Check rows for hidden singles
  for (let row = 0; row < size; row++) {
    for (let value = 1; value <= size; value++) {
      const possibleCols: number[] = [];
      let alreadyPlaced = false;

      for (let col = 0; col < size; col++) {
        const index = row * size + col;
        if (cells[index] === value) {
          alreadyPlaced = true;
          break;
        }
        if (cells[index] === null) {
          const candidates = getCandidates(cells, index, size);
          if (candidates.has(value)) {
            possibleCols.push(col);
          }
        }
      }

      if (!alreadyPlaced && possibleCols.length === 1) {
        const col = possibleCols[0];
        return {
          type: 'hidden_single',
          cellIndex: row * size + col,
          value,
          description: `${value} can only go in R${row + 1}C${col + 1} in row ${row + 1} (Hidden Single in Row)`,
        };
      }
    }
  }

  // Check columns for hidden singles
  for (let col = 0; col < size; col++) {
    for (let value = 1; value <= size; value++) {
      const possibleRows: number[] = [];
      let alreadyPlaced = false;

      for (let row = 0; row < size; row++) {
        const index = row * size + col;
        if (cells[index] === value) {
          alreadyPlaced = true;
          break;
        }
        if (cells[index] === null) {
          const candidates = getCandidates(cells, index, size);
          if (candidates.has(value)) {
            possibleRows.push(row);
          }
        }
      }

      if (!alreadyPlaced && possibleRows.length === 1) {
        const row = possibleRows[0];
        return {
          type: 'hidden_single',
          cellIndex: row * size + col,
          value,
          description: `${value} can only go in R${row + 1}C${col + 1} in column ${col + 1} (Hidden Single in Column)`,
        };
      }
    }
  }

  // Check boxes for hidden singles
  const boxesPerRow = size / boxConfig.cols;
  for (let box = 0; box < size; box++) {
    const boxRow = Math.floor(box / boxesPerRow) * boxConfig.rows;
    const boxCol = (box % boxesPerRow) * boxConfig.cols;

    for (let value = 1; value <= size; value++) {
      const possibleIndices: number[] = [];
      let alreadyPlaced = false;

      for (let r = boxRow; r < boxRow + boxConfig.rows && !alreadyPlaced; r++) {
        for (let c = boxCol; c < boxCol + boxConfig.cols && !alreadyPlaced; c++) {
          const index = r * size + c;
          if (cells[index] === value) {
            alreadyPlaced = true;
          } else if (cells[index] === null) {
            const candidates = getCandidates(cells, index, size);
            if (candidates.has(value)) {
              possibleIndices.push(index);
            }
          }
        }
      }

      if (!alreadyPlaced && possibleIndices.length === 1) {
        const index = possibleIndices[0];
        const { row, col } = getCellPosition(index, size);
        return {
          type: 'hidden_single',
          cellIndex: index,
          value,
          description: `${value} can only go in R${row + 1}C${col + 1} in box ${box + 1} (Hidden Single in Box)`,
        };
      }
    }
  }

  return null;
}
