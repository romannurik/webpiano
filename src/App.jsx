import React, { useState, useEffect } from "react";
import { INSTRUMENTS, Piano } from "./Piano";
import styles from "./App.module.scss";
import { PianoSettings } from "./PianoSettings";
import { useMediaQuery } from "./useMediaQuery";
import { flushSync } from "react-dom";

const DEFAULT_PIANO_CONFIG = {
  start: 'F2',
  keySize: 'normal',
  instrument: Object.keys(INSTRUMENTS)[0],
};

export default function App() {
  let [isFullscreen, setFullscreen] = useState(false);
  let isSinglePane = useMediaQuery('(max-width: 899px)');
  let [pianoConfig, setPianoConfig] = useState(DEFAULT_PIANO_CONFIG);

  useEffect(() => {
    let onFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
      flushSync(); // whhhyyy is this necessaaarrryyyy??
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  return (
    <div className={styles.app}>
      {(!isSinglePane || !isFullscreen) && (
        <div className={styles.settings}>
          <PianoSettings pianoConfig={pianoConfig} onPianoConfig={setPianoConfig} />
          {(!isFullscreen || isSinglePane) && <button onClick={() => document.body.requestFullscreen()}>
            {isSinglePane ? 'Start' : 'Fullscreen'}
          </button>}
        </div>
      )}
      {(!isSinglePane || isFullscreen) && <Piano className={styles.piano} {...pianoConfig} />}
    </div>
  );
}
