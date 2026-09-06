import { useCallback, useEffect, useState } from "react";

import { fetchGatewayStatus } from "../services/api";
import type { HealthResponse, PlatformMode } from "../types/health";

export type ApiHealthState = {
  data: HealthResponse | null;
  error: string | null;
  loading: boolean;
  mode: PlatformMode;
  isGatewayOnline: boolean;
  isDemoMode: boolean;
  retry: () => Promise<void>;
};

export function useApiHealth(): ApiHealthState {
  const [state, setState] = useState<Omit<ApiHealthState, "retry">>({
    data: null,
    error: null,
    loading: true,
    mode: "demo",
    isGatewayOnline: false,
    isDemoMode: true,
  });

  const checkHealth = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const controller = new AbortController();

    try {
      const result = await fetchGatewayStatus(controller.signal);
      setState({
        data: result.data,
        error: result.error,
        loading: false,
        mode: result.mode,
        isGatewayOnline: result.isGatewayOnline,
        isDemoMode: result.isDemoMode,
      });
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setState({
        data: null,
        error: "Gateway is currently unavailable.",
        loading: false,
        mode: "demo",
        isGatewayOnline: false,
        isDemoMode: true,
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { ...state, retry: checkHealth };
}
