import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarProps = {
  src: string;
  alt: string;
  size?: number;
  unoptimized?: boolean;
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
  className,
}: AvatarProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized={unoptimized}
      className={cn("rounded-full ring-1 ring-border", className)}
    />
  );
}
