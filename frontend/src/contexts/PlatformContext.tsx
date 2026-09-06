import { createContext, useContext } from "react";

import { useApiHealth } from "../hooks/useApiHealth";

type PlatformContextValue = ReturnType<typeof useApiHealth>;

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const apiHealth = useApiHealth();
  return <PlatformContext.Provider value={apiHealth}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) throw new Error("usePlatform must be used within PlatformProvider.");
  return context;
}
