import cn from "classnames";
import styles from "./IconButton.module.scss";

export function IconButton({
  className,
  disabled,
  checked,
  icon,
  onClick,
  ...props
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

function prevOption(options, current) {
  let curIndex = options.indexOf(current);
  return curIndex <= 0 ? options[options.length - 1] : options[curIndex - 1];
}

function nextOption(options, current) {
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
