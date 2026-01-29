export interface GameSettings {
  showPencilMarks: boolean;
  autoFillCandidates: boolean;
  showErrors: boolean;
  showHints: boolean;
  highlightSameNumbers: boolean;
  highlightRowColBox: boolean;
}

export const defaultSettings: GameSettings = {
  showPencilMarks: true,
  autoFillCandidates: false,
  showErrors: true,
  showHints: false,
  highlightSameNumbers: true,
  highlightRowColBox: true,
};
