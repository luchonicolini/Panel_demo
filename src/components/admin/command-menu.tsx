"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Search } from "lucide-react";
import { Kbd } from "@astryxdesign/core/Kbd";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { AdminCommandPalette } from "@/components/admin/command-palette";

type CommandMenuContextValue = {
  open: () => void;
};

const CommandMenuContext = createContext<CommandMenuContextValue | null>(null);

export function useCommandMenu() {
  const context = useContext(CommandMenuContext);
  if (!context) {
    throw new Error("useCommandMenu debe usarse dentro de CommandMenuProvider");
  }
  return context;
}

/**
 * Provee la command palette a todo el panel y registra el atajo global.
 * Los triggers de escritorio y mobile consumen el mismo estado.
 */
export function CommandMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((open) => !open);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo<CommandMenuContextValue>(
    () => ({ open: () => setIsOpen(true) }),
    [],
  );

  return (
    <CommandMenuContext.Provider value={value}>
      {children}
      <AdminCommandPalette isOpen={isOpen} onOpenChange={setIsOpen} />
    </CommandMenuContext.Provider>
  );
}

export function CommandMenuTrigger({ variant = "sidebar" }: { variant?: "sidebar" | "mobile" }) {
  const { open } = useCommandMenu();

  if (variant === "mobile") {
    return (
      <Tooltip content="Buscar en el panel" placement="below">
        <button
          type="button"
          onClick={open}
          className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.08] text-white transition-colors hover:bg-white/[0.13]"
          aria-label="Buscar en el panel"
        >
          <Search className="h-5 w-5" />
        </button>
      </Tooltip>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      className="mb-6 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-left text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
      aria-label="Buscar en el panel"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1">Buscar…</span>
      <Kbd keys="mod+k" className="nicolini-command-kbd" />
    </button>
  );
}
