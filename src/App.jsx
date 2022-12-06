import React, { useState, useEffect } from "react";
import { INSTRUMENTS, Piano } from "./Piano";
import styles from "./App.module.scss";
import { PianoSettings } from "./PianoSettings";
import { useMediaQuery } from "./useMediaQuery";

const DEFAULT_PIANO_CONFIG = {
  start: 'F2',
  keySize: 'normal',
  instrument: Object.keys(INSTRUMENTS)[0],
};

export default function App() {
  let [isPianoMode, setPianoMode] = useState(false);
  let isSinglePane = useMediaQuery('(max-width: 899px)');
  let [pianoConfig, setPianoConfig] = useState(DEFAULT_PIANO_CONFIG);

  useEffect(() => {
    let onFullscreenChange = () => {
      setPianoMode(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  return (
    <div className={styles.app}>
      {(!isSinglePane || !isPianoMode) && (
        <div className={styles.settings}>
          <PianoSettings pianoConfig={pianoConfig} onPianoConfig={setPianoConfig} />
          <button onClick={() => document.body.requestFullscreen()}>
            Start
          </button>
        </div>
      )}
      {(!isSinglePane || isPianoMode) && <Piano className={styles.piano} {...pianoConfig} />}
    </div>
  );
}
