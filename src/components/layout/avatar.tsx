import Image from "next/image";
import { cn } from "@/utils/cn";

type AvatarProps = {
  src?: string | null;
  alt: string;
  size?: number;
  unoptimized?: boolean;
  priority?: boolean;
  className?: string;
};

/**
 * Reusable avatar image component.
 *
 */
export function Avatar({
  src,
  alt,
  size = 32,
  unoptimized = true,
  priority = false,
  className,
}: AvatarProps) {
  const hasImage = Boolean(src?.trim());

  if (!hasImage) {
    return (
      <span
        role="img"
        aria-label={alt}
        style={{ width: size, height: size }}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground ring-1 ring-border",
          className,
        )}
      >
        {alt.trim().charAt(0).toUpperCase() || "?"}
      </span>
    );
  }

  return (
    <Image
      src={src!}
      alt={alt}
      width={size}
      height={size}
      unoptimized={unoptimized}
      priority={priority}
      className={cn("rounded-full ring-1 ring-border", className)}
    />
  );
}
