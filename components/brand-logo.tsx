import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
};

const sizeClasses = {
  sm: "h-12 w-12 sm:h-16 sm:w-16",
  md: "h-14 w-14 sm:h-20 sm:w-20",
  lg: "h-16 w-16 sm:h-24 sm:w-24",
  xl: "h-24 w-24 sm:h-32 sm:w-32",
} as const;

export function BrandLogo({
  size = "md",
  className,
  priority = false,
}: BrandLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "drop-shadow-[0_12px_24px_rgba(15,23,42,0.12)] dark:drop-shadow-[0_16px_26px_rgba(2,6,23,0.5)]",
        className
      )}
    >
      <Image
        src="/logo.svg"
        alt="DevImpact"
        width={1024}
        height={1024}
        priority={priority}
        className={cn("object-contain", sizeClasses[size])}
      />
    </span>
  );
}
