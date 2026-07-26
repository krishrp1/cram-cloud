"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

// resolvedTheme is only known after hydration (next-themes reads
// localStorage / system preference client-side) — rendering an icon tied to
// it before then would mismatch the server-rendered markup. useSyncExternalStore
// with a server snapshot of `false` is the standard hydration-safe way to
// detect "has the client taken over" without an effect + setState cascade.
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHydrated();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="relative overflow-hidden"
    >
      {mounted && (
        <>
          <Sun className="absolute rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
        </>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
