import { useState, useCallback, useEffect } from 'react';
import type { Difficulty } from './types/puzzle';
import { useGame3DState } from './hooks/useGame3DState';
import { useSettings } from './hooks/useSettings';
import { useKeyboard3DInput } from './hooks/useKeyboard3DInput';
import { IsometricCube } from './components/3d/IsometricCube';
import { ActiveLayerGrid } from './components/3d/ActiveLayerGrid';
import { LayerNav } from './components/3d/LayerNav';
import { PrintView3D } from './components/3d/PrintView3D';
import { NumberPad } from './components/ui/NumberPad';
import { TitleBar } from './components/ui/TitleBar';
import type { MenuAction } from './components/ui/TitleBar';
import { Button } from './components/ui/Button';
import { Modal } from './components/ui/Modal';
import { GameControls } from './components/game/GameControls';
import { NewGameModal, consumePendingNewGame } from './components/game/NewGameModal';
import type { Size3D } from './components/game/NewGameModal';
import { SettingsModal } from './components/settings/SettingsModal';
import type { SettingsTab } from './components/settings/SettingsModal';
// ShareModal not used in 3D (no URL encoding for 3D puzzles)
import './styles/globals.css';
import styles from './App3D.module.css';

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

  const { settings, toggleSetting, setColorMode } = useSettings();

  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('settings');
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCube, setShowCube] = useState(false);

  // Check for pending new game handed off from 2D mode
  useEffect(() => {
    const pending = consumePendingNewGame();
    if (pending?.mode === '3d') {
      setIsGenerating(true);
      setTimeout(() => {
        try {
          newPuzzle(pending.size3d, pending.difficulty);
        } finally {
          setIsGenerating(false);
        }
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.isComplete) setShowCompleteModal(true);
  }, [state.isComplete]);

  useKeyboard3DInput({
    size: state.puzzle.size,
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
      const flatIndex = state.activeLayer * (state.puzzle.size * state.puzzle.size) + state.selectedCell;
      if (state.puzzle.cells[flatIndex] !== null) return;
      if (state.isPencilMode) togglePencilMark(flatIndex, value);
      else setValue(flatIndex, value);
    },
    [state.selectedCell, state.activeLayer, state.puzzle, state.isPencilMode, setValue, togglePencilMark]
  );

  const handleClear = useCallback(() => {
    if (state.selectedCell === null) return;
    const flatIndex = state.activeLayer * (state.puzzle.size * state.puzzle.size) + state.selectedCell;
    clearCell(flatIndex);
  }, [state.selectedCell, state.activeLayer, state.puzzle.size, clearCell]);

  const handleStart3D = useCallback(
    (size: Size3D, difficulty: Difficulty) => {
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

  const layerSize = state.puzzle.size * state.puzzle.size;
  const selectedFlatIndex = state.selectedCell !== null
    ? state.activeLayer * layerSize + state.selectedCell
    : null;
  const isSelectedGiven = selectedFlatIndex !== null && state.puzzle.cells[selectedFlatIndex] !== null;
  const padSize = state.puzzle.size as 4 | 9 | 16 | 25;

  return (
    <div className={styles.app}>
      <TitleBar onMenuAction={handleMenuAction} />
      <main className={styles.main} data-print-hide>
        {showCube && (
          <IsometricCube
            size={state.puzzle.size}
            depth={state.puzzle.depth}
            puzzle3DCells={state.puzzle.cells}
            userValues={state.userValues}
            activeLayer={state.activeLayer}
            onLayerClick={changeLayer}
          />
        )}

        <LayerNav
          depth={state.puzzle.depth}
          activeLayer={state.activeLayer}
          onChangeLayer={changeLayer}
          showCube={showCube}
          onToggleCube={() => setShowCube(prev => !prev)}
        />

        <ActiveLayerGrid
          size={state.puzzle.size}
          activeLayer={state.activeLayer}
          puzzleCells={state.puzzle.cells}
          userValues={state.userValues}
          pencilMarks={state.pencilMarks}
          selectedCell={state.selectedCell}
          onCellClick={selectCell}
        />

        <NumberPad
          size={padSize}
          onNumberClick={handleNumberPadClick}
          disabled={state.selectedCell === null || isSelectedGiven}
          showNumberPad={settings.showNumberPad}
        />

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
          isPencilEnabled={true}
          isClearDisabled={state.selectedCell === null || isSelectedGiven}
        />
      </main>

      <PrintView3D
        size={state.puzzle.size}
        depth={state.puzzle.depth}
        difficulty={state.puzzle.difficulty}
        puzzleCells={state.puzzle.cells}
        userValues={state.userValues}
        pencilMarks={state.pencilMarks}
      />

      {/* New Game Modal */}
      <Modal isOpen={showNewGameModal} onClose={() => setShowNewGameModal(false)} title="New Game">
        <NewGameModal
          currentMode="3d"
          initialSize2D={9}
          initialSize3D={state.puzzle.size as 4 | 9 | 16}
          initialDifficulty={state.puzzle.difficulty}
          isGenerating={isGenerating}
          onStart2D={() => {/* handled by navigation inside NewGameModal */}}
          onStart3D={handleStart3D}
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

      {/* Share Modal (3D puzzles — no URL sharing yet) */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share">
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          Sharing is not yet available for 3D puzzles.
        </p>
      </Modal>

      {/* Complete Modal */}
      <Modal isOpen={showCompleteModal} onClose={() => setShowCompleteModal(false)} title="Congratulations!">
        <div className={styles.completeContent}>
          <p>
            You solved the {state.puzzle.size}×{state.puzzle.size}×{state.puzzle.depth}{' '}
            {state.puzzle.difficulty} puzzle!
          </p>
          <div className={styles.completeActions}>
            <Button variant="primary" onClick={() => { setShowCompleteModal(false); setShowNewGameModal(true); }}>
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
