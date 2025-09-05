import cn from "classnames";
import styles from "./IconButton.module.scss";
import type { ReactNode } from "react";

export function IconButton({
  className,
  disabled,
  checked,
  icon,
  onClick,
  ...props
}: {
  className?: string;
  disabled?: boolean;
  checked?: boolean;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      className={cn(className, styles.iconButton, {
        [styles.isChecked]: checked,
      })}
      onClick={onClick}
      {...props}
    >
      {icon}
    </button>
  );
}

function nextOption<T>(options: T[], current: T) {
  let curIndex = options.indexOf(current);
  return curIndex < 0 || curIndex === options.length - 1
    ? options[0]
    : options[curIndex + 1];
}

export function RotateOptionsIconButton({
  icon,
  className,
  options,
  value,
  onChange,
  ...props
}: {
  icon: ReactNode;
  className?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <IconButton
      {...props}
      className={className}
      onClick={() => onChange(nextOption(options, value))}
      icon={icon}
    />
  );
}
