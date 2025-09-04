import cn from "classnames";
import styles from './LoadingSpinner.module.scss';

export function LoadingSpinner({ className }) {
  return <div className={cn(styles.spinner, className)} />;
}
