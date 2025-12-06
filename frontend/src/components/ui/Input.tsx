import React from "react";
import { cn } from "../../utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, hint, error, className, containerClassName, ...rest },
    ref
  ) {
    return (
      <label className={cn("ui-field", containerClassName)}>
        {label && <span className="ui-field__label">{label}</span>}
        <input
          ref={ref}
          className={cn("ui-input", error && "ui-input--error", className)}
          {...rest}
        />
        {error ? (
          <span className="ui-field__error">{error}</span>
        ) : hint ? (
          <span className="ui-field__hint">{hint}</span>
        ) : null}
      </label>
    );
  }
);
