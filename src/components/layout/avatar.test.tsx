// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */

import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Avatar } from "./avatar";

vi.mock("next/image", () => ({
  default: ({
    unoptimized,
    priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean; priority?: boolean }) => {
    void unoptimized;
    void priority;
    return <img {...props} />;
  },
}));

describe("Avatar", () => {
  afterEach(cleanup);

  test("renders an image for a non-empty source", () => {
    render(<Avatar src="https://example.com/avatar.png" alt="Ada Lovelace" />);

    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toHaveAttribute(
      "src",
      "https://example.com/avatar.png",
    );
  });

  test.each(["", "   ", null, undefined])(
    "renders an initial fallback instead of an image for an invalid source",
    (src) => {
      render(<Avatar src={src} alt="Ada Lovelace" size={40} />);

      expect(screen.getByRole("img", { name: "Ada Lovelace" })).toHaveTextContent("A");
      expect(screen.queryByRole("img", { name: "Ada Lovelace" })?.tagName).toBe("SPAN");
      expect(document.querySelector("img")).not.toBeInTheDocument();
    },
  );
});
