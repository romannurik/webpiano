import cn from "classnames";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
import styles from "./App.module.scss";
import { Piano } from "./Piano";
import { PianoToolbar } from "./PianoToolbar";
import { INSTRUMENTS } from "./instruments";
import {
  deltaNote,
  diffNotes,
  makeChord,
  makeScale,
  optimalChordInversion,
  parseNote,
} from "./piano-util";
import type { PianoConfig } from "./types";

const PIANO_CONFIG_LOCAL_STORAGE_KEY = "pianoSettings";

// do this at the root to avoid flash of un-layout'd content
(() => {
  let update = () =>
    document.body.style.setProperty("--vh", `${window.innerHeight / 100}px`);
  update();
  window.addEventListener("resize", update, false);
})();

let initialPianoConfig: PianoConfig;
try {
  initialPianoConfig = JSON.parse(
    window.localStorage[PIANO_CONFIG_LOCAL_STORAGE_KEY]
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

  let transformActiveNotes = useCallback(
    (notes: string[]) => {
      if (!pianoConfig.chordMode) {
        return notes;
      }

      let modified = [];
      for (let note of notes) {
        let { note: n } = parseNote(note);
        let minor = ["A", "E"].includes(n);
        modified.push(note);
        let higherNote = deltaNote(note, 12);
        let scale = makeScale(higherNote, minor);
        let chord = makeChord(scale, 1, 3, 5);
        chord = optimalChordInversion(chord, "F4");
        modified.push(...chord);
      }
      return modified;
    },
    [pianoConfig.chordMode]
  );

  let downNotes = useRef<string[]>([]);
  let activeNotes = useRef<string[]>([]);
  let prevActiveNotes = useRef<string[]>([]);

  let { onNoteDown, onNoteUp } = useMemo(() => {
    let handleNotesChanged = () => {
      activeNotes.current = transformActiveNotes(downNotes.current);
      setHighlightNotes(activeNotes.current);
      let { added, removed } = diffNotes(
        prevActiveNotes.current,
        activeNotes.current
      );
      added.forEach((n) => tone.current?.triggerAttack(n as any));
      removed.forEach((n) => tone.current?.triggerRelease(n as any));
      prevActiveNotes.current = activeNotes.current;
    };

    let onNoteDown = (...notes: string[]) => {
      downNotes.current = [...downNotes.current, ...notes];
      handleNotesChanged();
    };
    let onNoteUp = (...notes: string[]) => {
      downNotes.current = downNotes.current.filter((n) => !notes.includes(n));
      handleNotesChanged();
    };
    return { onNoteDown, onNoteUp };
  }, [transformActiveNotes]);

  // play notes on a sequence
  // useEffect(() => {
  //   let scale = makeScale('E3', false);
  //   let queue = [{
  //     notes: [scale[0], scale[2], scale[4]],
  //     hold: 1000
  //   }];
  //   console.clear();
  //   console.log(queue);
  //   let cancel = false;
  //   (async () => {
  //     await new Promise(resolve => setTimeout(resolve, 1000));
  //     while (!cancel && queue.length) {
  //       let { notes, hold } = queue.shift();
  //       setPlayNotes(notes);
  //       await new Promise(resolve => setTimeout(resolve, hold));
  //     }
  //     setPlayNotes([]);
  //   })();
  //   return () => {
  //     cancel = true;
  //     setPlayNotes([]);
  //   }
  // }, []);

  useEffect(() => {
    document.documentElement.setAttribute(
      "theme",
      pianoConfig.dark ? "dark" : "light"
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

  return (
    <div className={cn(styles.app, { [styles.isVertical]: isVertical })}>
      <PianoToolbar
        className={styles.toolbar}
        vertical={isVertical}
        pianoConfig={pianoConfig}
        numWhiteKeys={numWhiteKeys * (dualPiano ? 2 : 1)}
        onPianoConfig={setPianoConfig}
      />
      <div className={styles.pianoContainer}>
        <Piano
          vertical={isVertical}
          className={styles.piano}
          {...pianoConfig}
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
  );
}
