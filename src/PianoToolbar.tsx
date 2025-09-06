import cn from "classnames";
import {
  ExpandIcon,
  MinimizeIcon,
  MoonIcon,
  Music4Icon,
  PencilIcon,
  SunIcon,
  ZoomInIcon,
  ZoomOutIcon
} from "lucide-react";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useAppState } from "./App";
import { IconButton, RotateOptionsIconButton } from "./components/IconButton";
import { InstrumentPicker } from "./InstrumentPicker";
import { CATEGORY_ICONS, INSTRUMENTS } from "./instruments";
import styles from "./PianoToolbar.module.scss";
import type { PianoConfig } from "./types";

export function PianoToolbar({
  className,
  pianoConfig,
  onPianoConfig,
  vertical,
  numWhiteKeys,
}: {
  className?: string;
  pianoConfig: PianoConfig;
  onPianoConfig: (config: PianoConfig) => void;
  vertical?: boolean;
  numWhiteKeys: number;
}) {
  let { instrument, keySize, offset, dark } = pianoConfig;
  let { editingChords, updateAppState } = useAppState();
  let [isFullscreen, setFullscreen] = useState(false);
  let [showInstrumentPicker, setShowInstrumentPicker] = useState(false);

  let updateConfig = (c: Partial<PianoConfig>) => {
    onPianoConfig({ ...pianoConfig, ...c });
  };

  useEffect(() => {
    let onFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
      flushSync(() => {}); // whhhyyy is this necessaaarrryyyy??
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  return (
    <>
      {showInstrumentPicker && (
        <InstrumentPicker
          vertical={vertical}
          selected={pianoConfig.instrument}
          onClose={() => setShowInstrumentPicker(false)}
          onSelect={(instrument: string) => {
            updateConfig({ instrument });
            setShowInstrumentPicker(false);
          }}
        />
      )}
      <div className={cn(className, styles.toolbar)}>
        <IconButton
          onClick={() => setShowInstrumentPicker(true)}
          icon={<InstrumentIcon instrument={instrument} />}
        />
        <IconButton
          icon={<Music4Icon />}
          checked={!!pianoConfig.chordMode}
          onClick={() => updateConfig({ chordMode: !pianoConfig.chordMode })}
        />
        {pianoConfig.chordMode && (
          <>
            <IconButton
              icon={<PencilIcon />}
              checked={!!editingChords}
              onClick={() => updateAppState({ editingChords: !editingChords })}
            />
          </>
        )}
        <RotateOptionsIconButton
          options={
            ["normal", "large", "huge"] satisfies Array<PianoConfig["keySize"]>
          }
          value={keySize}
          onChange={(keySize) =>
            updateConfig({ keySize: keySize as PianoConfig["keySize"] })
          }
          icon={keySize === "huge" ? <ZoomOutIcon /> : <ZoomInIcon />}
        />
        <div
          className={styles.scrollbar}
          onPointerDown={(ev) => {
            let rect = ev.currentTarget.getBoundingClientRect();
            let lpStart = vertical ? rect.bottom : rect.left;
            let lpEnd = vertical ? rect.top : rect.right;
            let origOffset = pianoConfig.offset;
            let downOffset = 0;

            let hit = (lp: number, first?: boolean) => {
              let pct = (lp - lpStart) / (lpEnd - lpStart);
              let offset = pct * 7 * 9; // - numWhiteKeys / 2;
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

            let move = (ev: PointerEvent) =>
              hit(vertical ? ev.clientY : ev.clientX);
            hit(vertical ? ev.clientY : ev.clientX, true);

            window.addEventListener("pointerup", cancel);
            window.addEventListener("pointercancel", cancel);
            window.addEventListener("pointermove", move);
          }}
        >
          {Array(9)
            .fill(null)
            .map((_, i) => (
              <div key={i} className={styles.octaveLabel}>
                {i + 1}
                <div className={styles.octaveLabelBlackKey} />
                <div className={styles.octaveLabelBlackKey} />
                <div className={styles.octaveLabelBlackKey} />
                <div className={styles.octaveLabelBlackKey} />
                <div className={styles.octaveLabelBlackKey} />
              </div>
            ))}
          <div
            className={styles.thumb}
            style={{
              left: `${(offset / (7 * 9)) * 100}%`,
              width: `${(numWhiteKeys / (7 * 9)) * 100}%`,
            }}
          />
        </div>
        <IconButton
          icon={dark ? <SunIcon /> : <MoonIcon />}
          onClick={() => updateConfig({ dark: !dark })}
        />
        {!isFullscreen && (
          <IconButton
            icon={<ExpandIcon />}
            onClick={() => document.body.requestFullscreen()}
          />
        )}
        {isFullscreen && (
          <IconButton
            icon={<MinimizeIcon />}
            onClick={() => document.exitFullscreen()}
          />
        )}
      </div>
    </>
  );
}

function InstrumentIcon({ instrument, ...props }: { instrument: string }) {
  const Icon =
    INSTRUMENTS[instrument].icon ||
    CATEGORY_ICONS[INSTRUMENTS[instrument].category];
  return <Icon {...props} />;
}
