"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

type HotkeyEvent = Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey"> & {
  isComposing?: boolean;
  nativeEvent?: { isComposing?: boolean };
};

type HotkeyTarget = {
  tagName?: string;
  isContentEditable?: boolean;
  closest?: (selector: string) => unknown;
};

export function matchesHotkey(event: HotkeyEvent, combo: string): boolean {
  if (event.isComposing || event.nativeEvent?.isComposing) return false;

  const parts = combo.toLowerCase().split("+");
  const key = parts[parts.length - 1];
  const wantsMod = parts.includes("mod");
  const hasMod = event.ctrlKey || event.metaKey;

  if (wantsMod !== hasMod || event.altKey) return false;
  if (key.length > 1 && event.shiftKey) return false;

  return event.key.toLowerCase() === key;
}

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);
const DIALOG_SELECTOR = 'dialog, [role="dialog"], [role="alertdialog"]';

export function isEditableTarget(target: HotkeyTarget | null | undefined): boolean {
  if (!target) return false;
  return Boolean(target.isContentEditable || (target.tagName && EDITABLE_TAGS.has(target.tagName)));
}

export function isInsideDialog(target: HotkeyTarget | null | undefined): boolean {
  return Boolean(target?.closest?.(DIALOG_SELECTOR));
}

type EscapeToClearEvent = HotkeyEvent & {
  preventDefault: () => void;
  currentTarget: { blur: () => void };
};

// Escape clears the field first, then a second press leaves it.
export function handleEscapeToClear(
  event: EscapeToClearEvent,
  value: string,
  setValue: (value: string) => void,
): void {
  if (!matchesHotkey(event, "escape")) return;
  if (value) {
    event.preventDefault();
    setValue("");
  } else {
    event.currentTarget.blur();
  }
}

export interface UseHotkeysOptions {
  enabled?: boolean;
}

export function useHotkeys(
  bindings: Record<string, (event: KeyboardEvent) => void>,
  options: UseHotkeysOptions = {},
) {
  const { enabled = true } = options;
  const bindingsRef = useRef(bindings);

  useEffect(() => {
    bindingsRef.current = bindings;
  });

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as HotkeyTarget | null;
      if (isEditableTarget(target) || isInsideDialog(target)) return;

      for (const [combo, handler] of Object.entries(bindingsRef.current)) {
        if (matchesHotkey(event, combo)) {
          event.preventDefault();
          handler(event);
          return;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}

export function isApplePlatform(platform: string): boolean {
  return /mac|iphone|ipad|ipod/i.test(platform);
}

const subscribeNoop = () => () => {};

export function useIsApplePlatform(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => isApplePlatform(navigator.userAgent),
    () => false,
  );
}
