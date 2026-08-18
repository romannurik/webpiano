import cn from "classnames";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as Tone from "tone";
import styles from "./App.module.scss";
import { Piano, type KeyAnnotation } from "./Piano";
import { PianoToolbar } from "./PianoToolbar";
import { TutorialBar } from "./TutorialBar";
import { INSTRUMENTS } from "./instruments";
import {
  deltaNote,
  diffNotes,
  makeChord,
  makeScale,
  noteStr,
  optimalChordInversion,
  parseNote,
} from "./piano-util";
import type { ChordType, PianoConfig } from "./types";

const PIANO_CONFIG_LOCAL_STORAGE_KEY = "pianoSettings";

// do this at the root to avoid flash of un-layout'd content
(() => {
  let update = () =>
    document.body.style.setProperty("--vh", `${window.innerHeight / 100}px`);
  update();
  window.addEventListener("resize", update, false);
})();

export type AppState = {
  editingChords: boolean;
  tutorialMode: boolean;
};

export type AppContextType = AppState & {
  updateAppState: (updates: Partial<AppState>) => void;
  pianoConfig: PianoConfig;
  updatePianoConfig: (updates: Partial<PianoConfig>) => void;
  setPianoConfig: React.Dispatch<React.SetStateAction<PianoConfig>>;
  toneLoaded: boolean;
  highlightNotes: string[];
  setHighlightNotes: React.Dispatch<React.SetStateAction<string[]>>;
  playNote: (note: string) => void;
  releaseNote: (note: string) => void;
  triggerAttack: (notes: string | string[]) => void;
  triggerRelease: (notes: string | string[]) => void;
  releaseAll: () => void;
};

export const AppContext = createContext<AppContextType>(null!);
export const useApp = () => useContext(AppContext);

let initialPianoConfig: PianoConfig;
try {
  initialPianoConfig = JSON.parse(
    window.localStorage[PIANO_CONFIG_LOCAL_STORAGE_KEY],
  );
  const { offset, keySize, instrument } = initialPianoConfig || {};
  if (typeof offset !== "number" || !keySize || !instrument) {
    throw "invalid config";
  }
} catch (e) {
  initialPianoConfig = {
    offset: 3 * 7, // beginning of octave 4 (C4)
    keySize: "large",
    instrument: Object.keys(INSTRUMENTS)[0],
    dark: false,
    chordMode: false,
  };
}

export default function App() {
  let [pianoConfig, setPianoConfig] = useState<PianoConfig>(initialPianoConfig);
  let [isVertical, setVertical] = useState(false);
  let [dualPiano, setDualPiano] = useState(false);
  let [numWhiteKeys, setNumWhiteKeys] = useState(1);

  let tone = useRef<Tone.Sampler | Tone.PolySynth>(null);
  let [toneLoaded, setToneLoaded] = useState(false);
  let [highlightNotes, setHighlightNotes] = useState<string[]>([]);
  let [appState, setAppState] = useState<AppState>({
    editingChords: false,
    tutorialMode: false,
  });

  useEffect(() => {
    if (!pianoConfig.chordMode) {
      setAppState((prev) => ({ ...prev, editingChords: false }));
    }
  }, [pianoConfig.chordMode]);

  // Set up audio library
  useEffect(() => {
    tone.current = INSTRUMENTS[pianoConfig.instrument].load();
    (async () => {
      await Tone.loaded();
      tone.current!.toDestination?.();
      setToneLoaded(true);
    })();
    return () => {
      tone.current = null;
    };
  }, [pianoConfig.instrument]);

  let noteTransformer = useRef<(notes: string[]) => string[]>(null);

  useEffect(() => {
    noteTransformer.current = null;
    if (pianoConfig.chordMode) {
      noteTransformer.current = (notes) => {
        // compute actual notes to play when in chord mode
        let modified = [];
        for (let note of notes) {
          let { note: n } = parseNote(note);
          let minor = pianoConfig.chordModeConfig?.[n] === "minor";
          modified.push(note);
          let higherNote = deltaNote(note, 12);
          let scale = makeScale(higherNote, minor);
          let chord = makeChord(scale, 1, 3, 5);
          chord = optimalChordInversion(chord, "F4");
          modified.push(...chord);
        }
        return modified;
      };
    }
  }, [pianoConfig]);

  let downNotes = useRef<string[]>([]);
  let activeNotes = useRef<string[]>([]);
  let prevActiveNotes = useRef<string[]>([]);

  let handleNotesChanged = useCallback(() => {
    let notes = downNotes.current;
    activeNotes.current = noteTransformer.current?.(notes) || notes;
    setHighlightNotes(activeNotes.current);
    let { added, removed } = diffNotes(
      prevActiveNotes.current,
      activeNotes.current,
    );
    added.forEach((n) => tone.current?.triggerAttack(n as any));
    removed.forEach((n) => tone.current?.triggerRelease(n as any));
    prevActiveNotes.current = activeNotes.current;
  }, []);

  let onNoteDown = useCallback(
    (...notes: string[]) => {
      downNotes.current = [...downNotes.current, ...notes];
      if (appState.editingChords) {
        setPianoConfig((prev) => ({
          ...prev,
          chordModeConfig: {
            ...prev.chordModeConfig,
            ...Object.fromEntries(
              notes.map((n) => {
                let { note } = parseNote(n);
                let newChord: ChordType =
                  prev.chordModeConfig?.[note] || "major";
                if (newChord === "major") {
                  newChord = "minor";
                } else {
                  newChord = "major";
                }
                return [note, newChord];
              }),
            ),
          },
        }));
        setTimeout(() => handleNotesChanged());
      } else {
        handleNotesChanged();
      }
    },
    [handleNotesChanged, appState.editingChords],
  );

  let onNoteUp = useCallback(
    (...notes: string[]) => {
      downNotes.current = downNotes.current.filter((n) => !notes.includes(n));
      handleNotesChanged();
    },
    [handleNotesChanged],
  );

  let updatePianoConfig = useCallback((updates: Partial<PianoConfig>) => {
    setPianoConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  let playNote = useCallback((note: string) => {
    if (!note || note === "-") return;
    setHighlightNotes([note]);
    tone.current?.triggerAttack(note as any);
  }, []);

  let releaseNote = useCallback((note: string) => {
    if (!note || note === "-") return;
    setHighlightNotes([]);
    tone.current?.triggerRelease(note as any);
  }, []);

  let triggerAttack = useCallback((notes: string | string[]) => {
    const list = Array.isArray(notes) ? notes : [notes];
    setHighlightNotes(list);
    list.forEach((n) => tone.current?.triggerAttack(n as any));
  }, []);

  let triggerRelease = useCallback((notes: string | string[]) => {
    const list = Array.isArray(notes) ? notes : [notes];
    setHighlightNotes([]);
    list.forEach((n) => tone.current?.triggerRelease(n as any));
  }, []);

  let releaseAll = useCallback(() => {
    setHighlightNotes([]);
    tone.current?.releaseAll?.();
  }, []);

  let updateAppState = useCallback((updates: Partial<AppState>) => {
    setAppState((prev) => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute(
      "theme",
      pianoConfig.dark ? "dark" : "light",
    );
  }, [pianoConfig]);

  useEffect(() => {
    let onResize = () => {
      let vertical = window.innerWidth < window.innerHeight;
      setVertical(vertical);
      setDualPiano(
        vertical ? window.innerWidth > 650 : window.innerHeight > 650
      );
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    window.localStorage[PIANO_CONFIG_LOCAL_STORAGE_KEY] =
      JSON.stringify(pianoConfig);
  }, [pianoConfig]);

  let annotations = useMemo(() => {
    let annotations: Record<string, KeyAnnotation> = {};
    if (appState.tutorialMode) {
      for (let octave = 1; octave <= 9; octave++) {
        for (let note of ["C", "D", "E", "F", "G", "A", "B"]) {
          annotations[`${note}${octave}`] = { label: note };
        }
      }
      return annotations;
    }
    if (!appState.editingChords) {
      return annotations;
    }

    for (let [k, chord] of Object.entries(pianoConfig.chordModeConfig || {})) {
      for (let i = 1; i <= 9; i++) {
        let label = {
          major: "",
          minor: "m",
        }[chord || "major"];
        annotations[noteStr({ note: k, octave: i })] = {
          label,
        };
      }
    }

    return annotations;
  }, [
    pianoConfig.chordModeConfig,
    appState.editingChords,
    appState.tutorialMode,
  ]);

  let appContextValue = useMemo<AppContextType>(
    () => ({
      ...appState,
      updateAppState,
      pianoConfig,
      updatePianoConfig,
      setPianoConfig,
      toneLoaded,
      highlightNotes,
      setHighlightNotes,
      playNote,
      releaseNote,
      triggerAttack,
      triggerRelease,
      releaseAll,
    }),
    [
      appState,
      updateAppState,
      pianoConfig,
      updatePianoConfig,
      toneLoaded,
      highlightNotes,
      playNote,
      releaseNote,
      triggerAttack,
      triggerRelease,
      releaseAll,
    ],
  );

  return (
    <AppContext.Provider value={appContextValue}>
      <div className={cn(styles.app, { [styles.isVertical]: isVertical })}>
        {appState.tutorialMode ? (
          <TutorialBar className={styles.toolbar} />
        ) : (
          <PianoToolbar
            className={styles.toolbar}
            vertical={isVertical}
            pianoConfig={pianoConfig}
            numWhiteKeys={numWhiteKeys * (dualPiano ? 2 : 1)}
            onPianoConfig={setPianoConfig}
          />
        )}
        <div className={styles.pianoContainer}>
          <Piano
            vertical={isVertical}
            className={styles.piano}
            {...pianoConfig}
            annotations={annotations}
            loading={!toneLoaded}
            onNoteDown={onNoteDown}
            onNoteUp={onNoteUp}
            highlightNotes={highlightNotes}
            onResize={(wk) => setNumWhiteKeys(wk)}
          />
          {dualPiano && (
            <Piano
              vertical={isVertical}
              className={styles.piano}
              {...pianoConfig}
              annotations={annotations}
              offset={pianoConfig.offset + numWhiteKeys}
              loading={!toneLoaded}
              onNoteDown={onNoteDown}
              onNoteUp={onNoteUp}
              highlightNotes={highlightNotes}
              onResize={(wk) => setNumWhiteKeys(wk)}
            />
          )}
        </div>
      </div>
    </AppContext.Provider>
  );
}
