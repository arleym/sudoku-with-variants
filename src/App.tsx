import { useState, useCallback, useEffect } from 'react';
import type { GridSize, Difficulty } from './types/puzzle';
import { useGameState } from './hooks/useGameState';
import { useSettings } from './hooks/useSettings';
import { useKeyboardInput } from './hooks/useKeyboardInput';
import { usePuzzleFromUrl } from './hooks/usePuzzleFromUrl';
import { SudokuGrid } from './components/grid/SudokuGrid';
import { PrintView2D } from './components/grid/PrintView2D';
import { NumberPad } from './components/ui/NumberPad';
import { TitleBar } from './components/ui/TitleBar';
import type { MenuAction } from './components/ui/TitleBar';
import { GameControls } from './components/game/GameControls';
import { HintPanel } from './components/game/HintPanel';
import { NewGameModal, consumePendingNewGame } from './components/game/NewGameModal';
import { SettingsModal } from './components/settings/SettingsModal';
import type { SettingsTab } from './components/settings/SettingsModal';
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

  const { settings, toggleSetting, setColorMode } = useSettings();

  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('settings');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load puzzle from URL if present
  useEffect(() => {
    if (urlPuzzle && !urlLoading) {
      loadPuzzle(urlPuzzle);
    }
  }, [urlPuzzle, urlLoading, loadPuzzle]);

  // Check for pending new game handed off from 3D mode
  useEffect(() => {
    const pending = consumePendingNewGame();
    if (pending?.mode === '2d') {
      setIsGenerating(true);
      setTimeout(() => {
        try {
          newPuzzle(pending.size2d, pending.difficulty);
        } finally {
          setIsGenerating(false);
        }
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show completion modal when puzzle is solved
  useEffect(() => {
    if (state.isComplete) {
      setShowCompleteModal(true);
    }
  }, [state.isComplete]);

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
      if (state.isPencilMode) togglePencilMark(state.selectedCell, value);
      else setValue(state.selectedCell, value);
    },
    [state.selectedCell, state.puzzle.cells, state.isPencilMode, setValue, togglePencilMark]
  );

  const handleClear = useCallback(() => {
    if (state.selectedCell !== null) clearCell(state.selectedCell);
  }, [state.selectedCell, clearCell]);

  const handleStart2D = useCallback(
    (size: GridSize, difficulty: Difficulty) => {
      setIsGenerating(true);
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

  const handleMenuAction = useCallback((action: MenuAction) => {
    switch (action) {
      case 'settings':
      case 'appearance':
      case 'info':
        setSettingsTab(action);
        setShowSettingsModal(true);
        break;
      case 'share':
        setShowShareModal(true);
        break;
      case 'print':
        window.print();
        break;
      case 'privacy':
        window.open('https://eightone.ca/privacy', '_blank');
        break;
    }
  }, []);

  if (urlLoading) {
    return (
      <div className={styles.app}>
        <div className={styles.loading}>Loading puzzle...</div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <TitleBar onMenuAction={handleMenuAction} />
      <main className={styles.main} data-print-hide>
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
          onNewGame={() => setShowNewGameModal(true)}
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

      <PrintView2D
        size={state.puzzle.size}
        difficulty={state.puzzle.difficulty}
        puzzleCells={state.puzzle.cells}
        userValues={state.userValues}
        pencilMarks={state.pencilMarks}
      />

      {/* New Game Modal */}
      <Modal
        isOpen={showNewGameModal}
        onClose={() => setShowNewGameModal(false)}
        title="New Game"
      >
        <NewGameModal
          currentMode="2d"
          initialSize2D={state.puzzle.size}
          initialSize3D={4}
          initialDifficulty={state.puzzle.difficulty}
          isGenerating={isGenerating}
          onStart2D={handleStart2D}
          onStart3D={() => {/* handled by navigation inside NewGameModal */}}
          onClose={() => setShowNewGameModal(false)}
        />
      </Modal>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onToggle={toggleSetting}
        onColorModeChange={setColorMode}
        initialTab={settingsTab}
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
                setShowNewGameModal(true);
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
