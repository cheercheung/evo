"use client";

import { useMemo } from "react";
import { loadPublicConfig, type PublicConfig } from "@/lib/config";

/**
 * Read public config once for client components.
 */
export function useEnvConfig(): PublicConfig {
  return useMemo(() => loadPublicConfig(), []);
}
