import cn from "classnames";
import {
  ArrowLeftIcon,
  ExpandIcon,
  MinimizeIcon,
  MoonIcon,
  PlayIcon,
  SquareIcon,
  SunIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import * as Tone from "tone";
import { useApp } from "./App";
import { IconButton, RotateOptionsIconButton } from "./components/IconButton";
import { SONGS } from "./songs";
import styles from "./TutorialBar.module.scss";
import type { PianoConfig } from "./types";

export function TutorialBar({ className }: { className?: string }) {
  const {
    pianoConfig,
    updatePianoConfig,
    updateAppState,
    playNote,
    releaseNote,
    releaseAll,
  } = useApp();
  const { keySize, dark } = pianoConfig;

  const [tutorialSong, setTutorialSong] = useState("twinkle");
  const [tutorialPlaying, setTutorialPlaying] = useState(false);
  const [isFullscreen, setFullscreen] = useState(false);
  const tutorialRun = useRef(0);

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
      flushSync(() => {});
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const stopSong = useCallback(() => {
    tutorialRun.current += 1;
    setTutorialPlaying(false);
    releaseAll();
  }, [releaseAll]);

  const playSong = useCallback(async () => {
    stopSong();
    const run = tutorialRun.current;
    setTutorialPlaying(true);
    await Tone.start();
    const notes = SONGS[tutorialSong]?.notes || [];
    const beatMs = 420;
    for (let { note, beats } of notes) {
      if (run !== tutorialRun.current) return;
      if (note === "-") note = "";
      if (note) playNote(note);
      await new Promise((resolve) =>
        window.setTimeout(resolve, beatMs * beats * 0.82),
      );
      if (run !== tutorialRun.current) return;
      if (note) releaseNote(note);
      await new Promise((resolve) =>
        window.setTimeout(resolve, beatMs * beats * 0.18),
      );
    }
    if (run === tutorialRun.current) {
      setTutorialPlaying(false);
      releaseAll();
    }
  }, [stopSong, tutorialSong, playNote, releaseNote, releaseAll]);

  useEffect(() => () => stopSong(), [stopSong]);

  return (
    <div className={cn(className, styles.toolbar)}>
      <button
        className={styles.backButton}
        onClick={() => {
          stopSong();
          updateAppState({ tutorialMode: false });
        }}
        aria-label="Exit tutorial"
      >
        <ArrowLeftIcon />
      </button>
      <RotateOptionsIconButton
        options={
          ["normal", "large", "huge"] satisfies Array<PianoConfig["keySize"]>
        }
        value={keySize}
        onChange={(keySize) =>
          updatePianoConfig({ keySize: keySize as PianoConfig["keySize"] })
        }
        icon={keySize === "huge" ? <ZoomOutIcon /> : <ZoomInIcon />}
      />
      <select
        className={styles.songSelect}
        value={tutorialSong}
        disabled={tutorialPlaying}
        onChange={(event) => setTutorialSong(event.target.value)}
        aria-label="Choose a song"
      >
        {Object.entries(SONGS).map(([id, song]) => (
          <option key={id} value={id}>
            {song.name}
          </option>
        ))}
      </select>
      <button
        className={cn(styles.playButton, {
          [styles.isPlaying]: tutorialPlaying,
        })}
        onClick={tutorialPlaying ? stopSong : playSong}
        aria-label={tutorialPlaying ? "Stop song" : "Play song"}
      >
        {tutorialPlaying ? (
          <>
            <SquareIcon />
            <span>Stop</span>
          </>
        ) : (
          <>
            <PlayIcon />
            <span>Play</span>
          </>
        )}
      </button>
      <IconButton
        icon={dark ? <SunIcon /> : <MoonIcon />}
        onClick={() => updatePianoConfig({ dark: !dark })}
      />
      {!isFullscreen ? (
        <IconButton
          icon={<ExpandIcon />}
          onClick={() => document.body.requestFullscreen()}
        />
      ) : (
        <IconButton
          icon={<MinimizeIcon />}
          onClick={() => document.exitFullscreen()}
        />
      )}
    </div>
  );
}
