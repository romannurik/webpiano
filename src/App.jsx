import cn from "classnames";
import React, { useEffect, useState } from "react";
import styles from "./App.module.scss";
import { Piano } from "./Piano";
import { PianoToolbar } from "./PianoToolbar";
import { INSTRUMENTS } from "./instruments";
import {
  deltaNote,
  makeChord,
  makeScale,
  optimalChordInversion,
  parseNote,
} from "./piano-util";

const PIANO_CONFIG_LOCAL_STORAGE_KEY = "pianoSettings";

// do this at the root to avoid flash of un-layout'd content
(() => {
  let update = () =>
    document.body.style.setProperty("--vh", `${window.innerHeight / 100}px`);
  update();
  window.addEventListener("resize", update, false);
})();

let initialPianoConfig = undefined;
try {
  initialPianoConfig = JSON.parse(
    window.localStorage[PIANO_CONFIG_LOCAL_STORAGE_KEY]
  );
  const { offset, keySize, instrument, dark } = initialPianoConfig;
  if (typeof offset !== "number" || !keySize || !instrument) {
    throw "invalid config";
  }
} catch (e) {
  initialPianoConfig = {
    offset: 3 * 7, // beginning of octave 4 (C4)
    keySize: "large",
    instrument: Object.keys(INSTRUMENTS)[0],
    dark: false,
  };
}

export default function App() {
  let [pianoConfig, setPianoConfig] = useState(initialPianoConfig);
  let [isVertical, setVertical] = useState(false);
  let [numWhiteKeys, setNumWhiteKeys] = useState(1);
  let [playNotes, setPlayNotes] = useState([]);

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
      setVertical(window.innerWidth < window.innerHeight);
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
        numWhiteKeys={numWhiteKeys}
        onPianoConfig={setPianoConfig}
      />
      <Piano
        vertical={isVertical}
        className={styles.piano}
        {...pianoConfig}
        playNotes={playNotes}
        onModifyNotes={(notes) => {
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
        }}
        onResize={(wk) => setNumWhiteKeys(wk)}
      />
    </div>
  );
}
