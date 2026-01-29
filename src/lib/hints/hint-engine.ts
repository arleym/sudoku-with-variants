import type { GridSize } from '../../types/puzzle';
import type { Hint } from './techniques';
import { findNakedSingle, findHiddenSingle } from './techniques';

export function getNextHint(
  cells: (number | null)[],
  size: GridSize
): Hint | null {
  // Try techniques in order of difficulty (easiest first)

  // 1. Naked Singles (easiest)
  const nakedSingle = findNakedSingle(cells, size);
  if (nakedSingle) return nakedSingle;

  // 2. Hidden Singles
  const hiddenSingle = findHiddenSingle(cells, size);
  if (hiddenSingle) return hiddenSingle;

  // No hint found with basic techniques
  return null;
}

export function getAllHints(
  cells: (number | null)[],
  size: GridSize,
  limit: number = 10
): Hint[] {
  const hints: Hint[] = [];
  const workingCells = [...cells];

  while (hints.length < limit) {
    const hint = getNextHint(workingCells, size);
    if (!hint) break;

    hints.push(hint);
    workingCells[hint.cellIndex] = hint.value;
  }

  return hints;
}
