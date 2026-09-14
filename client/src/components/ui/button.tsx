import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-700/50",
        destructive:
          "bg-red-600/90 text-white shadow-sm hover:bg-red-500 shadow-red-900/40 border border-red-500/30",
        outline:
          "border border-slate-700 bg-slate-900/60 hover:bg-slate-800 hover:text-white hover:border-slate-500 text-slate-200 backdrop-blur-md",
        secondary:
          "bg-slate-800 text-slate-100 shadow-sm hover:bg-slate-700 border border-slate-700/60",
        ghost:
          "hover:bg-slate-800/80 hover:text-slate-100 text-slate-300",
        link: "text-purple-400 underline-offset-4 hover:underline",
        flash:
          "bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white shadow-lg shadow-orange-900/40 hover:from-amber-400 hover:to-red-500 font-bold uppercase tracking-wider animate-pulse-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
