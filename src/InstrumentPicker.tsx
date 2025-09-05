import cn from "classnames";
import { CheckIcon, XIcon } from "lucide-react";
import { Fragment } from "react";
import { IconButton } from "./components/IconButton";
import styles from "./InstrumentPicker.module.scss";
import { CATEGORIES, CATEGORY_ICONS, INSTRUMENTS } from "./instruments";

export function InstrumentPicker({
  onClose,
  selected,
  onSelect,
  vertical,
}: {
  onClose: () => void;
  onSelect?: (instrument: string) => void;
  selected?: string;
  vertical?: boolean;
}) {
  return (
    <dialog className={cn(styles.root, { [styles.isVertical]: vertical })} open>
      <div className={styles.toolbar}>
        <IconButton icon={<XIcon />} onClick={onClose} />
      </div>
      <div className={styles.grid}>
        {CATEGORIES.map((c) => (
          <Fragment key={c}>
            <div className={styles.category}>
              <CategoryIcon category={c} />
              <span>{c}</span>
            </div>
            {Object.entries(INSTRUMENTS)
              .filter(([_, v]) => v.category === c)
              .map(([instrument, { title }]) => (
                <button
                  key={instrument}
                  onClick={() => onSelect?.(instrument)}
                  className={cn(styles.instrument, {
                    [styles.isSelected]: instrument === selected,
                  })}
                >
                  <div className={styles.iconSpace}>
                    {selected === instrument && <CheckIcon />}
                  </div>
                  <span>{title || instrument}</span>
                </button>
              ))}
          </Fragment>
        ))}
      </div>
    </dialog>
  );
}

function CategoryIcon({ category, ...props }: { category: string }) {
  let Icon = CATEGORY_ICONS[category];
  return <Icon {...props} />;
}
