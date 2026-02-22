// 3D Sudoku validator
// flat index = layer * (size*size) + row * size + col
// Supports size=4 (4×4×4) and size=9 (9×9×9) where depth = size

export function getIndex3D(layer: number, row: number, col: number, size: number): number {
  return layer * (size * size) + row * size + col;
}

/** Returns flat indices that conflict with the cell at flatIndex */
export function getConflicts3D(
  allValues: (number | null)[],
  flatIndex: number,
  size: number
): number[] {
  const layerSize = size * size;
  const layer = Math.floor(flatIndex / layerSize);
  const layerIndex = flatIndex % layerSize;
  const row = Math.floor(layerIndex / size);
  const col = layerIndex % size;
  const value = allValues[flatIndex];

  if (value === null) return [];

  const boxSize = Math.sqrt(size);
  const depth = size; // depth === size for NxNxN puzzles
  const conflicts: number[] = [];

  // Row in layer
  for (let c = 0; c < size; c++) {
    if (c === col) continue;
    const idx = getIndex3D(layer, row, c, size);
    if (allValues[idx] === value) conflicts.push(idx);
  }

  // Col in layer
  for (let r = 0; r < size; r++) {
    if (r === row) continue;
    const idx = getIndex3D(layer, r, col, size);
    if (allValues[idx] === value) conflicts.push(idx);
  }

  // Box in layer
  const boxRow = Math.floor(row / boxSize) * boxSize;
  const boxCol = Math.floor(col / boxSize) * boxSize;
  for (let r = boxRow; r < boxRow + boxSize; r++) {
    for (let c = boxCol; c < boxCol + boxSize; c++) {
      if (r === row && c === col) continue;
      const idx = getIndex3D(layer, r, c, size);
      if (allValues[idx] === value) conflicts.push(idx);
    }
  }

  // Pillar (same row/col across all layers)
  for (let d = 0; d < depth; d++) {
    if (d === layer) continue;
    const idx = getIndex3D(d, row, col, size);
    if (allValues[idx] === value) conflicts.push(idx);
  }

  return conflicts;
}

/** Returns all conflicting flat indices across the entire grid */
export function getAllConflicts3D(allValues: (number | null)[], size: number): Set<number> {
  const total = size * size * size;
  const conflictSet = new Set<number>();
  for (let i = 0; i < total; i++) {
    if (allValues[i] !== null) {
      const cs = getConflicts3D(allValues, i, size);
      if (cs.length > 0) {
        conflictSet.add(i);
        cs.forEach(c => conflictSet.add(c));
      }
    }
  }
  return conflictSet;
}

/** Check if the 3D puzzle is complete */
export function isComplete3D(
  puzzleCells: (number | null)[],
  userValues: (number | null)[],
  solution: number[],
  size: number
): boolean {
  const total = size * size * size;
  for (let i = 0; i < total; i++) {
    const val = puzzleCells[i] ?? userValues[i];
    if (val === null || val !== solution[i]) return false;
  }
  return true;
}

/** Validate that a complete grid satisfies all 3D constraints */
export function isValidSolution3D(grid: (number | null)[], size: number): boolean {
  const boxSize = Math.sqrt(size);
  const depth = size;
  const numBoxes = size / boxSize;

  for (let d = 0; d < depth; d++) {
    // Rows
    for (let r = 0; r < size; r++) {
      const seen = new Set<number>();
      for (let c = 0; c < size; c++) {
        const v = grid[getIndex3D(d, r, c, size)];
        if (v === null || seen.has(v)) return false;
        seen.add(v);
      }
    }
    // Cols
    for (let c = 0; c < size; c++) {
      const seen = new Set<number>();
      for (let r = 0; r < size; r++) {
        const v = grid[getIndex3D(d, r, c, size)];
        if (v === null || seen.has(v)) return false;
        seen.add(v);
      }
    }
    // Boxes
    for (let br = 0; br < numBoxes; br++) {
      for (let bc = 0; bc < numBoxes; bc++) {
        const seen = new Set<number>();
        for (let r = br * boxSize; r < br * boxSize + boxSize; r++) {
          for (let c = bc * boxSize; c < bc * boxSize + boxSize; c++) {
            const v = grid[getIndex3D(d, r, c, size)];
            if (v === null || seen.has(v)) return false;
            seen.add(v);
          }
        }
      }
    }
  }

  // Pillars
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const seen = new Set<number>();
      for (let d = 0; d < depth; d++) {
        const v = grid[getIndex3D(d, r, c, size)];
        if (v === null || seen.has(v)) return false;
        seen.add(v);
      }
    }
  }

  return true;
}

/** Related flat indices for a cell: row + col + box within layer */
export function getRelatedIndices3D(flatIndex: number, size: number): Set<number> {
  const layerSize = size * size;
  const layer = Math.floor(flatIndex / layerSize);
  const layerIndex = flatIndex % layerSize;
  const row = Math.floor(layerIndex / size);
  const col = layerIndex % size;
  const boxSize = Math.sqrt(size);

  const related = new Set<number>();

  for (let c = 0; c < size; c++) related.add(getIndex3D(layer, row, c, size));
  for (let r = 0; r < size; r++) related.add(getIndex3D(layer, r, col, size));

  const boxRow = Math.floor(row / boxSize) * boxSize;
  const boxCol = Math.floor(col / boxSize) * boxSize;
  for (let r = boxRow; r < boxRow + boxSize; r++) {
    for (let c = boxCol; c < boxCol + boxSize; c++) {
      related.add(getIndex3D(layer, r, c, size));
    }
  }

  related.delete(flatIndex);
  return related;
}

/** Pillar flat indices: same row/col across other layers */
export function getPillarIndices3D(flatIndex: number, size: number): Set<number> {
  const layerSize = size * size;
  const layer = Math.floor(flatIndex / layerSize);
  const layerIndex = flatIndex % layerSize;
  const row = Math.floor(layerIndex / size);
  const col = layerIndex % size;

  const pillar = new Set<number>();
  for (let d = 0; d < size; d++) {
    if (d !== layer) pillar.add(getIndex3D(d, row, col, size));
  }
  return pillar;
}
