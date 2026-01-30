import LZString from 'lz-string';
import type { Puzzle, GridSize, Difficulty } from '../../types/puzzle';

const URL_VERSION = 1;

interface EncodedPuzzle {
  v: number;      // version
  s: GridSize;    // size
  d: Difficulty;  // difficulty
  c: string;      // cells (compressed)
  o: string;      // solution (compressed)
}

function encodeCells(cells: (number | null)[]): string {
  // Encode as string of hex characters (0 = empty, 1-9, A-G for 10-16)
  return cells.map(c => {
    if (c === null) return '0';
    if (c <= 9) return String(c);
    return String.fromCharCode('A'.charCodeAt(0) + c - 10);
  }).join('');
}

function decodeCells(encoded: string): (number | null)[] {
  return encoded.split('').map(c => {
    if (c === '0') return null;
    const num = parseInt(c, 10);
    if (!isNaN(num)) return num;
    return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
  });
}

function encodeSolution(solution: number[]): string {
  return solution.map(c => {
    if (c <= 9) return String(c);
    return String.fromCharCode('A'.charCodeAt(0) + c - 10);
  }).join('');
}

function decodeSolution(encoded: string): number[] {
  return encoded.split('').map(c => {
    const num = parseInt(c, 10);
    if (!isNaN(num)) return num;
    return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
  });
}

export function encodePuzzleToUrl(puzzle: Puzzle): string {
  const data: EncodedPuzzle = {
    v: URL_VERSION,
    s: puzzle.size,
    d: puzzle.difficulty,
    c: encodeCells(puzzle.cells),
    o: encodeSolution(puzzle.solution),
  };

  const json = JSON.stringify(data);
  const compressed = LZString.compressToEncodedURIComponent(json);

  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('p', compressed);

  return url.toString();
}

export function encodePuzzleToShareString(puzzle: Puzzle): string {
  const data: EncodedPuzzle = {
    v: URL_VERSION,
    s: puzzle.size,
    d: puzzle.difficulty,
    c: encodeCells(puzzle.cells),
    o: encodeSolution(puzzle.solution),
  };

  const json = JSON.stringify(data);
  return LZString.compressToEncodedURIComponent(json);
}

export function decodePuzzleFromUrl(urlString?: string): Puzzle | null {
  try {
    const url = new URL(urlString ?? window.location.href);
    const compressed = url.searchParams.get('p');

    if (!compressed) return null;

    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;

    const data: EncodedPuzzle = JSON.parse(json);

    // Validate version
    if (data.v !== URL_VERSION) {
      console.warn('Unsupported puzzle version:', data.v);
      return null;
    }

    // Validate size
    if (![4, 9, 16, 25].includes(data.s)) {
      console.warn('Invalid puzzle size:', data.s);
      return null;
    }

    const cells = decodeCells(data.c);
    const solution = decodeSolution(data.o);

    // Validate cell count
    const expectedLength = data.s * data.s;
    if (cells.length !== expectedLength || solution.length !== expectedLength) {
      console.warn('Invalid cell count');
      return null;
    }

    return {
      id: generateId(),
      size: data.s,
      difficulty: data.d,
      cells,
      solution,
    };
  } catch (e) {
    console.warn('Failed to decode puzzle from URL:', e);
    return null;
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
