// @vitest-environment jsdom

import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { CompareForm } from "../components/compare-form";

vi.mock("@/components/providers/language-provider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function ControlledForm({
  initial1 = "",
  initial2 = "",
  onSubmit = () => {},
}: {
  initial1?: string;
  initial2?: string;
  onSubmit?: (
    username1: string,
    username2: string,
    options: { selectedLanguages: string[] },
  ) => void;
}) {
  const [username1, setUsername1] = useState(initial1);
  const [username2, setUsername2] = useState(initial2);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  return (
    <>
      <button type="button">outside</button>
      <CompareForm
        username1={username1}
        username2={username2}
        selectedLanguages={selectedLanguages}
        setUsername1={setUsername1}
        setUsername2={setUsername2}
        setSelectedLanguages={setSelectedLanguages}
        onSubmit={onSubmit}
      />
    </>
  );
}

describe("CompareForm / shortcut", () => {
  afterEach(() => {
    cleanup();
  });

  const pressSlashFromOutside = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: "outside" }));
    await user.keyboard("/");
  };

  test("focuses the first field when both are empty", async () => {
    const user = userEvent.setup();
    render(<ControlledForm />);

    await pressSlashFromOutside(user);

    expect(document.activeElement).toBe(screen.getByLabelText("form.username1.label"));
  });

  test("focuses the second field when only the first is filled", async () => {
    const user = userEvent.setup();
    render(<ControlledForm initial1="alice" />);

    await pressSlashFromOutside(user);

    const second = screen.getByLabelText("form.username2.label") as HTMLInputElement;
    expect(document.activeElement).toBe(second);
    expect(second.value).toBe("");
  });

  test("focuses the first field when only the second is filled", async () => {
    const user = userEvent.setup();
    render(<ControlledForm initial2="bob" />);

    await pressSlashFromOutside(user);

    expect(document.activeElement).toBe(screen.getByLabelText("form.username1.label"));
  });

  test("falls back to the first field when both are filled", async () => {
    const user = userEvent.setup();
    render(<ControlledForm initial1="alice" initial2="bob" />);

    await pressSlashFromOutside(user);

    expect(document.activeElement).toBe(screen.getByLabelText("form.username1.label"));
  });

  test("advertises the shortcut on the field it will focus", () => {
    render(<ControlledForm initial1="alice" />);

    expect(
      screen.getByLabelText("form.username1.label").getAttribute("aria-keyshortcuts"),
    ).toBeNull();
    expect(screen.getByLabelText("form.username2.label").getAttribute("aria-keyshortcuts")).toBe(
      "/",
    );
  });

  test("submits cleaned GitHub usernames", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ControlledForm
        initial1=" @octocat "
        initial2="https://github.com/torvalds/"
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "form.compare" }));

    expect(onSubmit).toHaveBeenCalledWith("octocat", "torvalds", { selectedLanguages: [] });
  });
});
