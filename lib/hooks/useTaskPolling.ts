"use client";

import { useEffect, useRef, useState } from "react";
import { EvolinkClient } from "@/lib/evolink-client";
import type { TaskQueryResponse } from "@/types/evolink";

interface Options {
  intervalMs?: number;
  onComplete?: (result: TaskQueryResponse) => void;
}

/**
 * Poll task status until completion/failure. Minimal version to replace repeated useEffect logic.
 */
export function useTaskPolling(
  apiKey: string,
  taskId: string,
  { intervalMs = 5000, onComplete }: Options = {}
) {
  const [data, setData] = useState<TaskQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep latest onComplete without retriggering the polling effect
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!taskId || !apiKey) return;
    doneRef.current = false;
    const client = new EvolinkClient(apiKey);

    const run = async () => {
      try {
        setLoading(true);
        const res = await client.queryTask(taskId);
        setData(res);
        if (res.status === "completed" || res.status === "failed") {
          doneRef.current = true;
          onCompleteRef.current?.(res);
        }
      } catch (err: any) {
        setError(err?.message || "查询失败");
      } finally {
        setLoading(false);
      }
    };

    // immediate + interval
    run();
    const timer = setInterval(() => {
      if (doneRef.current) return;
      run();
    }, intervalMs);

    return () => {
      doneRef.current = true;
      clearInterval(timer);
    };
  }, [apiKey, taskId, intervalMs]);

  return { data, error, loading };
}
