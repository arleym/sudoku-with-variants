import { useEffect, useState } from 'react';
import type { Puzzle } from '../types/puzzle';
import { decodePuzzleFromUrl } from '../lib/encoding/url-decoder';

export function usePuzzleFromUrl() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const decoded = decodePuzzleFromUrl();
      if (decoded) {
        setPuzzle(decoded);
      }
    } catch (e) {
      setError('Failed to load puzzle from URL');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear URL after loading (optional - keeps URL clean)
  useEffect(() => {
    if (puzzle && window.location.search) {
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    }
  }, [puzzle]);

  return { puzzle, loading, error };
}
