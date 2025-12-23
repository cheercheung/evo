"use client";

import { useMemo } from "react";
import { EvolinkClient } from "@/lib/evolink-client";
import { useEnvConfig } from "@/lib/hooks/useEnvConfig";

/**
 * Shared client instance based on public env config.
 */
export function useEvolinkClient() {
  const config = useEnvConfig();

  return useMemo(
    () => new EvolinkClient(config.apiKey, config.uploadAuthToken, { useProxy: config.useProxy }),
    [config.apiKey, config.uploadAuthToken, config.useProxy]
  );
}
