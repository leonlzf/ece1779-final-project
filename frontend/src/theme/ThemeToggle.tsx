import React from "react";
import { useTheme, type ThemeMode } from "./ThemeProvider";
import { Button } from "../components/ui/Button";

const order: ThemeMode[] = ["system", "light", "dark"];

function label(m: ThemeMode) {
  if (m === "system") return "System";
  if (m === "light") return "Light";
  return "Dark";
}

export function ThemeToggle() {
  const { mode, setMode, resolved } = useTheme();

  const next = () => {
    const i = order.indexOf(mode);
    setMode(order[(i + 1) % order.length]);
  };

  return (
    <Button variant="ghost" size="sm" onClick={next} title={`Theme: ${label(mode)}`}>
      <span style={{ opacity: 0.85 }}>{label(mode)}</span>
      <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.6 }}>
        ({resolved})
      </span>
    </Button>
  );
}
