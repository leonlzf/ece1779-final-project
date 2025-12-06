import { cn } from "../../utils/cn";

export function Spinner({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("ui-spinner", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
