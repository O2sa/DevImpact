"use client";

import { Button } from "./ui/button";
import { FaGithub } from "react-icons/fa";

export function GithubLink() {
  return (
    <a
      href="https://github.com/O2sa/DevImpact"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub Repository"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="flex items-center gap-2"
      >
        <FaGithub className="text-black dark:text-white" />
      </Button>
    </a>
  );
}