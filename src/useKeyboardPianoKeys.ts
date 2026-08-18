import { useEffect, useMemo, useRef } from "react";

export interface UseKeyboardPianoKeysOptions {
  onNoteDown?: (...notes: string[]) => void;
  onNoteUp?: (...notes: string[]) => void;
  enabled?: boolean;
  lowOctave?: number;
  highOctave?: number;
}

export function createKeyboardPianoMap(
  lowOctave = 2,
  highOctave = 4
): Record<string, string> {
  const map: Record<string, string> = {};

  const add = (keys: string[], note: string) => {
    for (const key of keys) {
      map[key] = note;
    }
  };

  // Low octave row (Number row + QWERTY row)
  // White keys: Q...] -> C...G
  add(["KeyQ", "q", "Q"], `C${lowOctave}`);
  add(["KeyW", "w", "W"], `D${lowOctave}`);
  add(["KeyE", "e", "E"], `E${lowOctave}`);
  add(["KeyR", "r", "R"], `F${lowOctave}`);
  add(["KeyT", "t", "T"], `G${lowOctave}`);
  add(["KeyY", "y", "Y"], `A${lowOctave}`);
  add(["KeyU", "u", "U"], `B${lowOctave}`);
  add(["KeyI", "i", "I"], `C${lowOctave + 1}`);
  add(["KeyO", "o", "O"], `D${lowOctave + 1}`);
  add(["KeyP", "p", "P"], `E${lowOctave + 1}`);
  add(["BracketLeft", "[", "{"], `F${lowOctave + 1}`);
  add(["BracketRight", "]", "}"], `G${lowOctave + 1}`);

  // Black keys: 23 = C# D#, 567 = F# G# A#, 90 = C# D#, = = F#
  add(["Digit2", "2", "@"], `C#${lowOctave}`);
  add(["Digit3", "3", "#"], `D#${lowOctave}`);
  add(["Digit5", "5", "%"], `F#${lowOctave}`);
  add(["Digit6", "6", "^"], `G#${lowOctave}`);
  add(["Digit7", "7", "&"], `A#${lowOctave}`);
  add(["Digit9", "9", "("], `C#${lowOctave + 1}`);
  add(["Digit0", "0", ")"], `D#${lowOctave + 1}`);
  add(["Equal", "=", "+"], `F#${lowOctave + 1}`);

  // Higher octave row (Home row + ZXCV row)
  // White keys: Z.../ -> C...E
  add(["KeyZ", "z", "Z"], `C${highOctave}`);
  add(["KeyX", "x", "X"], `D${highOctave}`);
  add(["KeyC", "c", "C"], `E${highOctave}`);
  add(["KeyV", "v", "V"], `F${highOctave}`);
  add(["KeyB", "b", "B"], `G${highOctave}`);
  add(["KeyN", "n", "N"], `A${highOctave}`);
  add(["KeyM", "m", "M"], `B${highOctave}`);
  add(["Comma", ",", "<"], `C${highOctave + 1}`);
  add(["Period", ".", ">"], `D${highOctave + 1}`);
  add(["Slash", "/", "?"], `E${highOctave + 1}`);

  // Black keys: SD = C# D#, GHJ = F# G# A#, L; = C# D#
  add(["KeyS", "s", "S"], `C#${highOctave}`);
  add(["KeyD", "d", "D"], `D#${highOctave}`);
  add(["KeyG", "g", "G"], `F#${highOctave}`);
  add(["KeyH", "h", "H"], `G#${highOctave}`);
  add(["KeyJ", "j", "J"], `A#${highOctave}`);
  add(["KeyL", "l", "L"], `C#${highOctave + 1}`);
  add(["Semicolon", ";", ":"], `D#${highOctave + 1}`);

  return map;
}

export function useKeyboardPianoKeys({
  onNoteDown,
  onNoteUp,
  enabled = true,
  lowOctave = 2,
  highOctave = 4,
}: UseKeyboardPianoKeysOptions = {}) {
  const onNoteDownRef = useRef(onNoteDown);
  onNoteDownRef.current = onNoteDown;

  const onNoteUpRef = useRef(onNoteUp);
  onNoteUpRef.current = onNoteUp;

  const keyMap = useMemo(
    () => createKeyboardPianoMap(lowOctave, highOctave),
    [lowOctave, highOctave]
  );

  const activeKeys = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!enabled) {
      if (activeKeys.current.size > 0) {
        for (const note of activeKeys.current.values()) {
          onNoteUpRef.current?.(note);
        }
        activeKeys.current.clear();
      }
      return;
    }

    const isInputTarget = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      return (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isInputTarget(event.target)) return;

      const note = keyMap[event.code] || keyMap[event.key];
      if (!note) return;

      const keyId = event.code || event.key;
      if (activeKeys.current.has(keyId)) return;

      activeKeys.current.set(keyId, note);
      onNoteDownRef.current?.(note);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const keyId = event.code || event.key;
      const note =
        activeKeys.current.get(keyId) ||
        keyMap[event.code] ||
        keyMap[event.key];
      if (note) {
        activeKeys.current.delete(keyId);
        onNoteUpRef.current?.(note);
      }
    };

    const handleBlur = () => {
      if (activeKeys.current.size > 0) {
        for (const note of activeKeys.current.values()) {
          onNoteUpRef.current?.(note);
        }
        activeKeys.current.clear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);

      if (activeKeys.current.size > 0) {
        for (const note of activeKeys.current.values()) {
          onNoteUpRef.current?.(note);
        }
        activeKeys.current.clear();
      }
    };
  }, [enabled, keyMap]);
}
