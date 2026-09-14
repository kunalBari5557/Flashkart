import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-purple-600/20 text-purple-300 border-purple-500/40",
        secondary:
          "border-transparent bg-slate-800 text-slate-300 border-slate-700",
        destructive:
          "border-transparent bg-red-950/60 text-red-400 border-red-800/50",
        outline: "text-slate-300 border-slate-700",
        success:
          "border-transparent bg-emerald-950/60 text-emerald-400 border-emerald-800/50",
        warning:
          "border-transparent bg-amber-950/60 text-amber-400 border-amber-800/50 animate-pulse",
        flash:
          "border-orange-500/50 bg-gradient-to-r from-orange-950/80 to-red-950/80 text-orange-300 shadow-sm animate-pulse-glow",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
