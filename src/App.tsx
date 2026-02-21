import { useState, useCallback, useEffect } from 'react';
import type { GridSize, Difficulty } from './types/puzzle';
import { useGameState } from './hooks/useGameState';
import { useSettings } from './hooks/useSettings';
import { useKeyboardInput } from './hooks/useKeyboardInput';
import { usePuzzleFromUrl } from './hooks/usePuzzleFromUrl';
import { SudokuGrid } from './components/grid/SudokuGrid';
import { NumberPad } from './components/ui/NumberPad';
import { GameControls } from './components/game/GameControls';
import { DifficultySelector } from './components/game/DifficultySelector';
import { HintPanel } from './components/game/HintPanel';
import { SettingsModal } from './components/settings/SettingsModal';
import { ShareModal } from './components/share/ShareModal';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import './styles/globals.css';
import styles from './App.module.css';

function App() {
  const { puzzle: urlPuzzle, loading: urlLoading } = usePuzzleFromUrl();
  const {
    state,
    selectCell,
    setValue,
    togglePencilMark,
    clearCell,
    togglePencilMode,
    undo,
    redo,
    resetPuzzle,
    newPuzzle,
    loadPuzzle,
    canUndo,
    canRedo,
  } = useGameState();

  const { settings, toggleSetting } = useSettings();

  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load puzzle from URL if present
  useEffect(() => {
    if (urlPuzzle && !urlLoading) {
      loadPuzzle(urlPuzzle);
    }
  }, [urlPuzzle, urlLoading, loadPuzzle]);

  // Show completion modal when puzzle is solved
  useEffect(() => {
    if (state.isComplete) {
      setShowCompleteModal(true);
    }
  }, [state.isComplete]);

  // Keyboard input handling
  useKeyboardInput({
    size: state.puzzle.size,
    selectedCell: state.selectedCell,
    isPencilMode: state.isPencilMode,
    onSelectCell: selectCell,
    onSetValue: setValue,
    onTogglePencilMark: togglePencilMark,
    onClearCell: clearCell,
    onTogglePencilMode: togglePencilMode,
    onUndo: undo,
    onRedo: redo,
    isGivenCell: (index) => state.puzzle.cells[index] !== null,
  });

  const handleNumberPadClick = useCallback(
    (value: number) => {
      if (state.selectedCell === null) return;
      if (state.puzzle.cells[state.selectedCell] !== null) return;

      if (state.isPencilMode) {
        togglePencilMark(state.selectedCell, value);
      } else {
        setValue(state.selectedCell, value);
      }
    },
    [state.selectedCell, state.puzzle.cells, state.isPencilMode, setValue, togglePencilMark]
  );

  const handleClear = useCallback(() => {
    if (state.selectedCell !== null) {
      clearCell(state.selectedCell);
    }
  }, [state.selectedCell, clearCell]);

  const handleNewGame = useCallback(() => {
    setShowNewGameModal(true);
  }, []);

  const handleStartNewGame = useCallback(
    async (size: GridSize, difficulty: Difficulty) => {
      setIsGenerating(true);

      // Use setTimeout to allow UI to update before generating
      setTimeout(() => {
        try {
          newPuzzle(size, difficulty);
        } finally {
          setIsGenerating(false);
          setShowNewGameModal(false);
        }
      }, 50);
    },
    [newPuzzle]
  );

  const handleApplyHint = useCallback(
    (index: number, value: number) => {
      setValue(index, value);
      selectCell(index);
    },
    [setValue, selectCell]
  );

  if (urlLoading) {
    return (
      <div className={styles.app}>
        <div className={styles.loading}>Loading puzzle...</div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <main className={styles.main}>
        <SudokuGrid
          size={state.puzzle.size}
          puzzleCells={state.puzzle.cells}
          userValues={state.userValues}
          pencilMarks={state.pencilMarks}
          selectedCell={state.selectedCell}
          settings={settings}
          onCellClick={selectCell}
        />

        <NumberPad
          size={state.puzzle.size}
          onNumberClick={handleNumberPadClick}
          disabled={
            state.selectedCell === null ||
            state.puzzle.cells[state.selectedCell] !== null
          }
          showNumberPad={settings.showNumberPad}
        />

        {settings.showHints && (
          <HintPanel
            puzzleCells={state.puzzle.cells}
            userValues={state.userValues}
            size={state.puzzle.size}
            onApplyHint={handleApplyHint}
          />
        )}

        <GameControls
          onUndo={undo}
          onRedo={redo}
          onReset={resetPuzzle}
          onNewGame={handleNewGame}
          onShare={() => setShowShareModal(true)}
          onSettings={() => setShowSettingsModal(true)}
          onClear={handleClear}
          onTogglePencilMode={togglePencilMode}
          canUndo={canUndo}
          canRedo={canRedo}
          isPencilMode={state.isPencilMode}
          isPencilEnabled={settings.showPencilMarks || settings.autoFillCandidates}
          isClearDisabled={
            state.selectedCell === null ||
            state.puzzle.cells[state.selectedCell] !== null
          }
        />
      </main>

      {/* New Game Modal */}
      <Modal
        isOpen={showNewGameModal}
        onClose={() => setShowNewGameModal(false)}
        title="New Game"
      >
        {isGenerating ? (
          <div className={styles.generating}>Generating puzzle...</div>
        ) : (
          <DifficultySelector
            initialSize={state.puzzle.size}
            initialDifficulty={state.puzzle.difficulty}
            onSelect={handleStartNewGame}
            onCancel={() => setShowNewGameModal(false)}
          />
        )}
      </Modal>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onToggle={toggleSetting}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        puzzle={state.puzzle}
      />

      {/* Completion Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Congratulations!"
      >
        <div className={styles.completeContent}>
          <p>You solved the {state.puzzle.size}×{state.puzzle.size} {state.puzzle.difficulty} puzzle!</p>
          <div className={styles.completeActions}>
            <Button
              onClick={() => {
                setShowCompleteModal(false);
                handleNewGame();
              }}
              variant="primary"
            >
              New Game
            </Button>
            <Button
              onClick={() => {
                setShowCompleteModal(false);
                setShowShareModal(true);
              }}
            >
              Share
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
