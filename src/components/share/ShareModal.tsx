import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Puzzle } from '../../types/puzzle';
import { encodePuzzleToUrl } from '../../lib/encoding/url-encoder';
import styles from './ShareModal.module.css';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzle: Puzzle;
}

export function ShareModal({ isOpen, onClose, puzzle }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = encodePuzzleToUrl(puzzle);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Sudoku Puzzle',
          text: `Try this ${puzzle.size}×${puzzle.size} ${puzzle.difficulty} Sudoku puzzle!`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
        console.log('Share cancelled or failed');
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Puzzle">
      <div className={styles.content}>
        <p className={styles.description}>
          Share this {puzzle.size}×{puzzle.size} {puzzle.difficulty} puzzle with
          friends!
        </p>

        <div className={styles.urlContainer}>
          <input
            type="text"
            readOnly
            value={shareUrl}
            className={styles.urlInput}
            onClick={e => (e.target as HTMLInputElement).select()}
          />
        </div>

        <div className={styles.actions}>
          <Button onClick={handleCopy} variant="secondary" size="medium">
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
          {typeof navigator.share === 'function' && (
            <Button onClick={handleShare} variant="primary" size="medium">
              Share
            </Button>
          )}
        </div>

        <p className={styles.note}>
          URL length: {shareUrl.length} characters
        </p>
      </div>
    </Modal>
  );
}
