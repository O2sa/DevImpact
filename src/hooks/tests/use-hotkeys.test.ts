import { describe, expect, it, vi } from "vitest";
import {
  handleEscapeToClear,
  isApplePlatform,
  isEditableTarget,
  isInsideDialog,
  matchesHotkey,
} from "../use-hotkeys";

function keyEvent(key: string, overrides: Partial<KeyboardEvent> = {}) {
  return {
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    isComposing: false,
    defaultPrevented: false,
    ...overrides,
  };
}

describe("matchesHotkey", () => {
  it("matches a plain key without modifiers", () => {
    expect(matchesHotkey(keyEvent("/"), "/")).toBe(true);
    expect(matchesHotkey(keyEvent("Escape"), "escape")).toBe(true);
  });

  it("does not hijack browser shortcuts that use modifiers", () => {
    expect(matchesHotkey(keyEvent("/", { ctrlKey: true }), "/")).toBe(false);
    expect(matchesHotkey(keyEvent("/", { metaKey: true }), "/")).toBe(false);
    expect(matchesHotkey(keyEvent("/", { altKey: true }), "/")).toBe(false);
  });

  it("allows Shift for symbol keys typed with Shift on some layouts", () => {
    expect(matchesHotkey(keyEvent("/", { shiftKey: true }), "/")).toBe(true);
    expect(matchesHotkey(keyEvent("Enter", { ctrlKey: true, shiftKey: true }), "mod+enter")).toBe(
      false,
    );
  });

  it("treats mod as either Ctrl or Cmd", () => {
    expect(matchesHotkey(keyEvent("Enter", { ctrlKey: true }), "mod+enter")).toBe(true);
    expect(matchesHotkey(keyEvent("Enter", { metaKey: true }), "mod+enter")).toBe(true);
    expect(matchesHotkey(keyEvent("Enter"), "mod+enter")).toBe(false);
  });

  it("ignores keys pressed while an IME composition is active", () => {
    expect(matchesHotkey(keyEvent("Escape", { isComposing: true }), "escape")).toBe(false);
  });
});

describe("isEditableTarget", () => {
  it("detects form fields and contenteditable elements", () => {
    expect(isEditableTarget({ tagName: "INPUT" })).toBe(true);
    expect(isEditableTarget({ tagName: "TEXTAREA" })).toBe(true);
    expect(isEditableTarget({ tagName: "SELECT" })).toBe(true);
    expect(isEditableTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
  });

  it("ignores other elements", () => {
    expect(isEditableTarget({ tagName: "BUTTON" })).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe("isInsideDialog", () => {
  it("uses closest() to find an enclosing dialog", () => {
    expect(isInsideDialog({ closest: () => ({}) })).toBe(true);
    expect(isInsideDialog({ closest: () => null })).toBe(false);
    expect(isInsideDialog(undefined)).toBe(false);
  });
});

describe("isApplePlatform", () => {
  it("recognises Apple user agents", () => {
    expect(isApplePlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)")).toBe(true);
    expect(isApplePlatform("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe(true);
    expect(isApplePlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(false);
  });
});

describe("handleEscapeToClear", () => {
  function fieldEvent(key: string) {
    return { ...keyEvent(key), preventDefault: vi.fn(), currentTarget: { blur: vi.fn() } };
  }

  it("clears a filled field on Escape without leaving it", () => {
    const event = fieldEvent("Escape");
    const setValue = vi.fn();

    handleEscapeToClear(event, "octocat", setValue);

    expect(setValue).toHaveBeenCalledWith("");
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.currentTarget.blur).not.toHaveBeenCalled();
  });

  it("leaves an empty field on Escape", () => {
    const event = fieldEvent("Escape");
    const setValue = vi.fn();

    handleEscapeToClear(event, "", setValue);

    expect(event.currentTarget.blur).toHaveBeenCalled();
    expect(setValue).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("ignores keys other than Escape", () => {
    const event = fieldEvent("a");
    const setValue = vi.fn();

    handleEscapeToClear(event, "octocat", setValue);

    expect(setValue).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.currentTarget.blur).not.toHaveBeenCalled();
  });
});
