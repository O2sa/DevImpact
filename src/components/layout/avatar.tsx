import Image from "next/image";
import { cn } from "@/utils/cn";

type AvatarProps = {
  src: string;
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
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized={unoptimized}
      priority={priority}
      className={cn("rounded-full ring-1 ring-border", className)}
    />
  );
}
