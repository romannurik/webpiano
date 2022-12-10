import React, { useState, useEffect } from "react";
import { INSTRUMENTS, Piano } from "./Piano";
import styles from "./App.module.scss";
import { PianoToolbar } from "./PianoToolbar";
import { useMediaQuery } from "./useMediaQuery";
import { flushSync } from "react-dom";
import cn from 'classnames';

const PIANO_CONFIG_LOCAL_STORAGE_KEY = 'pianoSettings';

const DEFAULT_PIANO_CONFIG = window.localStorage[PIANO_CONFIG_LOCAL_STORAGE_KEY]
  ? JSON.parse(window.localStorage[PIANO_CONFIG_LOCAL_STORAGE_KEY])
  : {
    start: 'F3',
    keySize: 'large',
    instrument: Object.keys(INSTRUMENTS)[0],
  };

export default function App() {
  let [pianoConfig, setPianoConfig] = useState(DEFAULT_PIANO_CONFIG);
  let [isVertical, setVertical] = useState(false);

  useEffect(() => {
    let onResize = () => {
      setVertical(window.innerWidth < window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    window.localStorage[PIANO_CONFIG_LOCAL_STORAGE_KEY] = JSON.stringify(pianoConfig);
  }, [pianoConfig]);

  return (
    <div className={cn(styles.app, { [styles.isVertical]: isVertical })}>
      <PianoToolbar className={styles.toolbar} pianoConfig={pianoConfig} onPianoConfig={setPianoConfig} />
      <Piano vertical={isVertical} className={styles.piano} {...pianoConfig} />
    </div>
  );
}
