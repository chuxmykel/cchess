import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { getGameNotes, saveGameNotes } from '../network/restClient';

/** How long typing must pause before what's written is saved. */
export const NOTES_SAVE_DELAY_MS = 1000;

export type GameNotesState = {
  /** Null until they've loaded. */
  body: string | null;
  /** Writes them, saving once typing pauses. */
  change: (body: string) => void;
  /** Saves what's written now, if it isn't yet - as the notes close. */
  flush: () => void;
  isSaving: boolean;
  /** The last save failed; the next change, or flush, tries again. */
  failed: boolean;
};

/** Your own notes on a game, kept on the server, seen by nobody else. */
export function useGameNotes(gameId: string): GameNotesState {
  const { authorized } = useAuthSession();
  const [body, setBody] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const saved = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<string | null>(null);

  useEffect(() => {
    let current = true;
    authorized((token) => getGameNotes(gameId, token))
      .then((notes) => {
        if (!current) return;
        saved.current = notes.body;
        latest.current = notes.body;
        setBody(notes.body);
      })
      .catch(() => {
        if (!current) return;
        saved.current = '';
        latest.current = '';
        setBody('');
      });
    return () => {
      current = false;
    };
  }, [authorized, gameId]);

  const save = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const toSave = latest.current;
    if (toSave === null || toSave === saved.current) return;
    setIsSaving(true);
    authorized((token) => saveGameNotes(gameId, toSave, token))
      .then(() => {
        saved.current = toSave;
        setFailed(false);
      })
      .catch(() => setFailed(true))
      .finally(() => setIsSaving(false));
  }, [authorized, gameId]);

  const change = useCallback(
    (next: string) => {
      latest.current = next;
      setBody(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(save, NOTES_SAVE_DELAY_MS);
    },
    [save],
  );

  // Whatever's unsaved goes as the notes are left.
  useEffect(
    () => () => {
      save();
    },
    [save],
  );

  return { body, change, flush: save, isSaving, failed };
}
