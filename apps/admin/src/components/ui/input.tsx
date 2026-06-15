import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  {
    variants: {
      size: {
        xs:      "h-7 px-2.5 py-1 text-xs file:text-xs",
        sm:      "h-8 px-3 py-1.5 text-sm file:text-sm",
        default: "h-9 px-3 py-1 text-base md:text-sm file:text-sm",
        lg:      "h-10 px-4 py-2 text-base file:text-base",
      },
    },
    defaultVariants: { size: "sm" },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
