import cn from 'classnames';
import { ExpandIcon, KeyboardMusicIcon, MinimizeIcon, MoonIcon, PianoIcon, SunIcon, WandSparklesIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { INSTRUMENTS } from "./Piano";
import styles from "./PianoToolbar.module.scss";

export function PianoToolbar({ className, pianoConfig, onPianoConfig, vertical, numWhiteKeys }) {
  let { instrument, keySize, offset, dark } = pianoConfig;
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
        icon={Object.keys(INSTRUMENTS)[0] === instrument ? <PianoIcon /> : <KeyboardMusicIcon />} />
      <IconButton icon={<WandSparklesIcon />}
        checked={!!pianoConfig.chordMode}
        onClick={() => updateConfig({ chordMode: !pianoConfig.chordMode })} />
      <RotateOptionsIconButton
        options={['normal', 'large', 'huge']}
        value={keySize}
        onChange={keySize => updateConfig({ keySize })}
        icon={keySize === 'huge' ? <ZoomOutIcon /> : <ZoomInIcon />} />
      <div
        className={styles.scrollbar}
        onPointerDown={ev => {
          let rect = ev.currentTarget.getBoundingClientRect();
          let lpStart = vertical ? rect.bottom : rect.left;
          let lpEnd = vertical ? rect.top : rect.right;
          let origOffset = pianoConfig.offset;
          let downOffset = 0;

          let hit = (lp, first) => {
            let pct = (lp - lpStart) / (lpEnd - lpStart);
            let offset = pct * 7 * 9;// - numWhiteKeys / 2;
            if (first) {
              downOffset = offset;
              offset = origOffset;
            } else {
              offset = offset - downOffset + origOffset;
            }
            offset = Math.max(0, Math.min(7 * 9 - numWhiteKeys, offset));
            onPianoConfig({ ...pianoConfig, offset });
            return offset;
          };

          let cancel = () => {
            window.removeEventListener("pointerup", cancel);
            window.removeEventListener("pointercancel", cancel);
            window.removeEventListener("pointermove", move);
          };

          let move = (ev) => hit(vertical ? ev.clientY : ev.clientX);
          hit(vertical ? ev.clientY : ev.clientX, true);

          window.addEventListener("pointerup", cancel);
          window.addEventListener("pointercancel", cancel);
          window.addEventListener("pointermove", move);
        }}>
        {Array(9).fill(null).map((_, i) => (
          <div key={i} className={styles.octaveLabel}>{i + 1}</div>
        ))}
        <div className={styles.thumb}
          style={{
            left: `${offset / (7 * 9) * 100}%`,
            width: `${numWhiteKeys / (7 * 9) * 100}%`,
          }} />
      </div>
      <IconButton icon={dark ? <SunIcon /> : <MoonIcon />}
        onClick={() => updateConfig({ dark: !dark })} />
      {!isFullscreen && <IconButton icon={<ExpandIcon />}
        onClick={() => document.body.requestFullscreen()} />}
      {isFullscreen && <IconButton icon={<MinimizeIcon />}
        onClick={() => document.exitFullscreen()} />}
    </div>
  );
}

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

function IconButton({ className, disabled, checked, icon, onClick, ...props }) {
  return <button disabled={disabled} className={cn(className, styles.iconButton, { [styles.isChecked]: checked })} onClick={onClick} {...props}>
    {icon}
  </button>;
}
