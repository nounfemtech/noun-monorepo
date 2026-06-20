"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { IconX } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&:has([data-alert-actions])]:pr-24",
  {
    variants: {
      variant: {
        default:
          "bg-background text-foreground [&>svg]:text-foreground",
        info:
          "border-blue-200 bg-blue-50 text-blue-900 [&>svg]:text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200 dark:[&>svg]:text-blue-400",
        success:
          "border-green-200 bg-green-50 text-green-900 [&>svg]:text-green-600 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-200 dark:[&>svg]:text-green-400",
        warning:
          "border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 dark:[&>svg]:text-amber-400",
        destructive:
          "border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200 dark:[&>svg]:text-red-400",
      },
      shape: {
        card: "rounded-lg border p-4 [&>svg]:left-4 [&>svg]:top-4",
        banner: [
          "rounded-none border-x-0 border-t-0 border-b px-6 py-3",
          "[&>svg]:left-6 [&>svg]:top-3",
          "[&>[data-alert-actions]]:right-6",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "card",
    },
  }
)

function Alert({
  className,
  variant,
  shape,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant, shape }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return (
    <h5
      data-slot="alert-title"
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  )
}

function AlertActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-actions"
      data-alert-actions=""
      className={cn(
        "absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      data-slot="alert-action"
      className={cn(
        "inline-flex items-center justify-center gap-1 h-7 rounded-md bg-zinc-900 px-2 text-xs font-medium text-white transition-opacity hover:opacity-80 outline-none focus-visible:ring-[3px] focus-visible:ring-zinc-900/50 dark:bg-zinc-100 dark:text-zinc-900 dark:focus-visible:ring-zinc-100/50",
        className
      )}
      {...props}
    />
  )
}

function AlertClose({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      data-slot="alert-close"
      aria-label="Fechar"
      className={cn(
        "rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity outline-none focus-visible:ring-[3px] focus-visible:ring-current",
        className
      )}
      {...props}
    >
      <IconX size={14} />
    </button>
  )
}

export { Alert, AlertTitle, AlertDescription, AlertActions, AlertAction, AlertClose }
