import cn from 'classnames';
import React, { useEffect, useState } from "react";
import styles from "./App.module.scss";
import { INSTRUMENTS, Piano } from "./Piano";
import { PianoToolbar } from "./PianoToolbar";

const PIANO_CONFIG_LOCAL_STORAGE_KEY = 'pianoSettings';

// do this at the root to avoid flash of un-layout'd content
(() => {
  let update = () => document.body.style.setProperty('--vh', `${window.innerHeight / 100}px`);
  update();
  window.addEventListener('resize', update, false);
})();

const DEFAULT_PIANO_CONFIG = window.localStorage[PIANO_CONFIG_LOCAL_STORAGE_KEY]
  ? JSON.parse(window.localStorage[PIANO_CONFIG_LOCAL_STORAGE_KEY])
  : {
    start: 'F3',
    keySize: 'large',
    instrument: Object.keys(INSTRUMENTS)[0],
    dark: false,
  };

export default function App() {
  let [pianoConfig, setPianoConfig] = useState(DEFAULT_PIANO_CONFIG);
  let [isVertical, setVertical] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('theme', pianoConfig.dark ? 'dark' : 'light');
  }, [pianoConfig]);

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
