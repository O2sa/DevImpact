import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

type ErrorMessageProps = {
  error: string;
  onRetry?: () => void;
};

function getErrorDetails(error: string): {
  title: string;
  description: string;
} {
  const lower = error.toLowerCase();
  if (lower.includes("not found") || lower.includes("user not found")) {
    return {
      title: "User not found",
      description:
        "The GitHub username you entered does not exist. Please check the spelling and try again.",
    };
  }
  if (lower.includes("rate limit") || lower.includes("rate_limit")) {
    return {
      title: "Rate limit exceeded",
      description:
        "GitHub API rate limit has been reached. Please wait a few minutes and try again.",
    };
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return {
      title: "Network error",
      description:
        "Could not connect to the server. Check your internet connection and try again.",
    };
  }
  return {
    title: "Something went wrong",
    description: error || "An unexpected error occurred. Please try again.",
  };
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const { title, description } = getErrorDetails(error);

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{description}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm underline underline-offset-2 hover:no-underline"
          >
            Try again
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}
