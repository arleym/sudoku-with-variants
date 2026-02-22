import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Difficulty } from './types/puzzle';
import { useGame3DState } from './hooks/useGame3DState';
import { useKeyboard3DInput } from './hooks/useKeyboard3DInput';
import { IsometricCube } from './components/3d/IsometricCube';
import { ActiveLayerGrid } from './components/3d/ActiveLayerGrid';
import { LayerNav } from './components/3d/LayerNav';
import { NumberPad } from './components/ui/NumberPad';
import { Button } from './components/ui/Button';
import { Modal } from './components/ui/Modal';
import './styles/globals.css';
import styles from './App3D.module.css';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

function App3D() {
  const {
    state,
    selectCell,
    setValue,
    togglePencilMark,
    clearCell,
    togglePencilMode,
    changeLayer,
    undo,
    redo,
    resetPuzzle,
    newPuzzle,
    canUndo,
    canRedo,
  } = useGame3DState();

  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Show completion modal
  useEffect(() => {
    if (state.isComplete) setShowCompleteModal(true);
  }, [state.isComplete]);

  // Keyboard input
  useKeyboard3DInput({
    activeLayer: state.activeLayer,
    selectedCell: state.selectedCell,
    isPencilMode: state.isPencilMode,
    onSelectCell: selectCell,
    onSetValue: setValue,
    onTogglePencilMark: togglePencilMark,
    onClearCell: clearCell,
    onTogglePencilMode: togglePencilMode,
    onChangeLayer: changeLayer,
    onUndo: undo,
    onRedo: redo,
    isGivenCell: (flatIndex) => state.puzzle.cells[flatIndex] !== null,
  });

  const handleNumberPadClick = useCallback(
    (value: number) => {
      if (state.selectedCell === null) return;
      const flatIndex = state.activeLayer * 16 + state.selectedCell;
      if (state.puzzle.cells[flatIndex] !== null) return;

      if (state.isPencilMode) {
        togglePencilMark(flatIndex, value);
      } else {
        setValue(flatIndex, value);
      }
    },
    [state.selectedCell, state.activeLayer, state.puzzle.cells, state.isPencilMode, setValue, togglePencilMark]
  );

  const handleClear = useCallback(() => {
    if (state.selectedCell === null) return;
    const flatIndex = state.activeLayer * 16 + state.selectedCell;
    clearCell(flatIndex);
  }, [state.selectedCell, state.activeLayer, clearCell]);

  const handleStartNewGame = useCallback(
    (difficulty: Difficulty) => {
      setIsGenerating(true);
      setTimeout(() => {
        try {
          newPuzzle(difficulty);
        } finally {
          setIsGenerating(false);
          setShowNewGameModal(false);
        }
      }, 50);
    },
    [newPuzzle]
  );

  const isSelectedGiven =
    state.selectedCell !== null &&
    state.puzzle.cells[state.activeLayer * 16 + state.selectedCell] !== null;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>3D Sudoku</h1>
          <p className={styles.subtitle}>4×4×4 · {state.puzzle.difficulty}</p>
        </div>
        <Link to="/" className={styles.modeSwitch}>2D Mode</Link>
      </header>

      <main className={styles.main}>
        {/* Isometric cube overview */}
        <IsometricCube
          puzzle3DCells={state.puzzle.cells}
          userValues={state.userValues}
          activeLayer={state.activeLayer}
          onLayerClick={changeLayer}
        />

        {/* Layer navigation */}
        <LayerNav
          activeLayer={state.activeLayer}
          onChangeLayer={changeLayer}
        />

        {/* Active layer grid */}
        <ActiveLayerGrid
          activeLayer={state.activeLayer}
          puzzleCells={state.puzzle.cells}
          userValues={state.userValues}
          pencilMarks={state.pencilMarks}
          selectedCell={state.selectedCell}
          onCellClick={selectCell}
        />

        {/* Number pad */}
        <NumberPad
          size={4}
          onNumberClick={handleNumberPadClick}
          disabled={state.selectedCell === null || isSelectedGiven}
          showNumberPad={true}
        />

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.controlRow}>
            <Button onClick={undo} disabled={!canUndo} size="small">Undo</Button>
            <Button onClick={redo} disabled={!canRedo} size="small">Redo</Button>
            <Button onClick={handleClear} disabled={state.selectedCell === null || isSelectedGiven} size="small">
              Clear
            </Button>
            <Button
              onClick={togglePencilMode}
              variant={state.isPencilMode ? 'primary' : 'secondary'}
              size="small"
            >
              {state.isPencilMode ? '✏️ Pencil' : 'Pencil'}
            </Button>
          </div>
          <div className={styles.controlRow}>
            <Button onClick={resetPuzzle} variant="danger" size="small">Reset</Button>
            <Button onClick={() => setShowNewGameModal(true)} variant="primary" size="small">
              New Game
            </Button>
          </div>
        </div>
      </main>

      {/* New Game Modal */}
      <Modal
        isOpen={showNewGameModal}
        onClose={() => setShowNewGameModal(false)}
        title="New 3D Game"
      >
        {isGenerating ? (
          <div className={styles.generating}>Generating 3D puzzle…</div>
        ) : (
          <div className={styles.difficultyPicker}>
            <p>Choose difficulty:</p>
            <div className={styles.difficultyButtons}>
              {DIFFICULTIES.map(d => (
                <Button
                  key={d}
                  variant={d === state.puzzle.difficulty ? 'primary' : 'secondary'}
                  onClick={() => handleStartNewGame(d)}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </Button>
              ))}
            </div>
            <Button onClick={() => setShowNewGameModal(false)} size="small">Cancel</Button>
          </div>
        )}
      </Modal>

      {/* Complete Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Congratulations!"
      >
        <div className={styles.completeContent}>
          <p>You solved the 3D Sudoku ({state.puzzle.difficulty})!</p>
          <div className={styles.completeActions}>
            <Button
              variant="primary"
              onClick={() => {
                setShowCompleteModal(false);
                setShowNewGameModal(true);
              }}
            >
              New Game
            </Button>
            <Button onClick={() => setShowCompleteModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App3D;
