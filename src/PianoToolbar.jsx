import React, { useCallback, useEffect, useState } from "react";
import { INSTRUMENTS } from "./Piano";
import styles from "./PianoToolbar.module.scss";
import cn from 'classnames';
import { ArrowsPointingIn, ArrowsPointingOut, ChevronLeft, ChevronRight, MagnifyingGlassMinus, MagnifyingGlassPlus, Moon, MusicalNote, Sun } from "./icons";
import { flushSync } from "react-dom";

const START_KEYS = ['F1', 'F2', 'F3', 'F4'];

export function PianoToolbar({ className, pianoConfig, onPianoConfig }) {
  let { instrument, keySize, start, dark } = pianoConfig;
  let [isFullscreen, setFullscreen] = useState(false);

  let updateConfig = (c) => {
    onPianoConfig({ ...pianoConfig, ...c });
  };

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
    <div className={cn(className, styles.toolbar)}>
      <RotateOptionsIconButton
        options={Object.keys(INSTRUMENTS)}
        value={instrument}
        onChange={instrument => updateConfig({ instrument })}
        icon={<MusicalNote />} />
      <RotateOptionsIconButton
        options={['normal', 'large', 'huge']}
        value={keySize}
        onChange={keySize => updateConfig({ keySize })}
        icon={keySize === 'huge' ? <MagnifyingGlassMinus /> : <MagnifyingGlassPlus />} />
      <IconButton
        icon={<ChevronLeft />}
        disabled={start === START_KEYS[0]}
        onClick={() => updateConfig({ start: prevOption(START_KEYS, start) })} />
      <div>{start}</div>
      <IconButton
        icon={<ChevronRight />}
        disabled={start === START_KEYS[START_KEYS.length - 1]}
        onClick={() => updateConfig({ start: nextOption(START_KEYS, start) })} />
      <Spacer />
      <IconButton icon={dark ? <Sun/> : <Moon />}
        onClick={() => updateConfig({ dark: !dark })} />
      {!isFullscreen && <IconButton icon={<ArrowsPointingOut />}
        onClick={() => document.body.requestFullscreen()} />}
      {isFullscreen && <IconButton icon={<ArrowsPointingIn />}
        onClick={() => document.exitFullscreen()} />}
    </div>
  );
}

const Spacer = () => <div style={{ flex: 1 }} />;

function prevOption(options, current) {
  let curIndex = options.indexOf(current);
  return curIndex <= 0 ? options[options.length - 1] : options[curIndex - 1];
}

function nextOption(options, current) {
  let curIndex = options.indexOf(current);
  return (curIndex < 0 || curIndex === options.length - 1)
    ? options[0]
    : options[curIndex + 1];
}

function RotateOptionsIconButton({ icon, className, options, value, onChange, ...props }) {
  return <IconButton
    {...props}
    className={className}
    onClick={() => onChange(nextOption(options, value))}
    icon={icon} />;
}

function IconButton({ className, disabled, icon, onClick, ...props }) {
  return <button disabled={disabled} className={cn(className, styles.iconButton)} onClick={onClick} {...props}>
    {icon}
  </button>;
}
