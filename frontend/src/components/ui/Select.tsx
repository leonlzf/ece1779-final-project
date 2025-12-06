import React from "react";
import { cn } from "../../utils/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, hint, error, className, containerClassName, children, ...rest },
    ref
  ) {
    return (
      <label className={cn("ui-field", containerClassName)}>
        {label && <span className="ui-field__label">{label}</span>}
        <select
          ref={ref}
          className={cn("ui-select", error && "ui-select--error", className)}
          {...rest}
        >
          {children}
        </select>
        {error ? (
          <span className="ui-field__error">{error}</span>
        ) : hint ? (
          <span className="ui-field__hint">{hint}</span>
        ) : null}
      </label>
    );
  }
);
