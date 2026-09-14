"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseClipboardCopyOptions {
  timeoutMs?: number;
}

export function useClipboardCopy(options: UseClipboardCopyOptions = {}) {
  const { timeoutMs = 2000 } = options;
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        await navigator.clipboard.writeText(text);
        setCopied(true);
        timerRef.current = setTimeout(() => {
          setCopied(false);
          timerRef.current = null;
        }, timeoutMs);
        return true;
      } catch {
        setCopied(false);
        return false;
      }
    },
    [timeoutMs],
  );

  return { copied, copy };
}
