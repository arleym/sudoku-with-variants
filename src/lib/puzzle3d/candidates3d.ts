import { getIndex3D } from './validator3d';

/** Get candidate values (1–size) for a cell, excluding row/col/box within layer AND pillar */
export function getCandidates3D(grid: (number | null)[], flatIndex: number, size: number): Set<number> {
  const layerSize = size * size;
  const layer = Math.floor(flatIndex / layerSize);
  const layerIndex = flatIndex % layerSize;
  const row = Math.floor(layerIndex / size);
  const col = layerIndex % size;
  const boxSize = Math.sqrt(size);
  const depth = size; // NxNxN: depth === size

  const used = new Set<number>();

  // Row in layer
  for (let c = 0; c < size; c++) {
    const v = grid[getIndex3D(layer, row, c, size)];
    if (v !== null) used.add(v);
  }

  // Col in layer
  for (let r = 0; r < size; r++) {
    const v = grid[getIndex3D(layer, r, col, size)];
    if (v !== null) used.add(v);
  }

  // Box in layer
  const boxRow = Math.floor(row / boxSize) * boxSize;
  const boxCol = Math.floor(col / boxSize) * boxSize;
  for (let r = boxRow; r < boxRow + boxSize; r++) {
    for (let c = boxCol; c < boxCol + boxSize; c++) {
      const v = grid[getIndex3D(layer, r, c, size)];
      if (v !== null) used.add(v);
    }
  }

  // Pillar (same row/col across all layers)
  for (let d = 0; d < depth; d++) {
    const v = grid[getIndex3D(d, row, col, size)];
    if (v !== null) used.add(v);
  }

  const candidates = new Set<number>();
  for (let v = 1; v <= size; v++) {
    if (!used.has(v)) candidates.add(v);
  }
  return candidates;
}
