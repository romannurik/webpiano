import React from "react";
import { INSTRUMENTS } from "./Piano";
import styles from "./PianoSettings.module.scss";

export function PianoSettings({ pianoConfig, onPianoConfig }) {
  let { instrument, keySize, start } = pianoConfig;

  let updateConfig = (c) => {
    onPianoConfig({ ...pianoConfig, ...c });
  };

  return (
    <div className={styles.settings}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Instrument</span>
        <select
          value={instrument}
          onChange={(ev) =>
            updateConfig({ instrument: ev.currentTarget.value })
          }
        >
          {Object.keys(INSTRUMENTS).map((instr) => (
            <option key={instr} value={instr}>
              {instr}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Start note</span>
        <select
          value={start}
          onChange={(ev) => updateConfig({ start: ev.currentTarget.value })}
        >
          <option value="F2">F2</option>
          <option value="F3">F3</option>
          <option value="F4">F4</option>
        </select>
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Key size</span>
        <select
          value={keySize}
          onChange={(ev) => updateConfig({ keySize: ev.currentTarget.value })}
        >
          <option value="normal">Normal</option>
          <option value="large">Large</option>
          <option value="huge">Huge</option>
        </select>
      </label>
    </div>
  );
}
