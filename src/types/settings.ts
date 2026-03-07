export type ColorMode = 'light' | 'dark' | 'system' | 'autumn-dark' | 'autumn-light' | 'nord';

export interface GameSettings {
  showPencilMarks: boolean;
  autoFillCandidates: boolean;
  autoCleanPencilMarks: boolean;
  showErrors: boolean;
  showHints: boolean;
  highlightSameNumbers: boolean;
  highlightRowColBox: boolean;
  showNumberPad: boolean;
  colorMode: ColorMode;
}

export const defaultSettings: GameSettings = {
  showPencilMarks: true,
  autoFillCandidates: false,
  autoCleanPencilMarks: true,
  showErrors: true,
  showHints: false,
  highlightSameNumbers: true,
  highlightRowColBox: true,
  showNumberPad: true,
  colorMode: 'system',
};
