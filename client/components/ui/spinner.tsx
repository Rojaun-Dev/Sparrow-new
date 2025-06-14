import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const spinnerVariants = cva("animate-spin rounded-full border-t-transparent", {
  variants: {
    size: {
      xs: "h-3 w-3 border-[1.5px]",
      sm: "h-4 w-4 border-2",
      md: "h-6 w-6 border-2",
      lg: "h-8 w-8 border-[3px]",
      xl: "h-10 w-10 border-4",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export function Spinner({ size, className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn(spinnerVariants({ size }), className)}
      {...props}
      role="status"
      aria-label="Loading"
    />
  );
} 