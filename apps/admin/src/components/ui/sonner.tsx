"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      style={
        {
          "--normal-bg": "hsl(var(--popover))",
          "--normal-border": "hsl(var(--border))",
          "--normal-text": "hsl(var(--popover-foreground))",
          "--success-bg": "hsl(var(--popover))",
          "--success-border": "hsl(var(--border))",
          "--success-text": "hsl(var(--popover-foreground))",
          "--info-bg": "hsl(var(--popover))",
          "--info-border": "hsl(var(--border))",
          "--info-text": "hsl(var(--popover-foreground))",
          "--warning-bg": "hsl(var(--popover))",
          "--warning-border": "hsl(var(--border))",
          "--warning-text": "hsl(var(--popover-foreground))",
          "--error-bg": "hsl(var(--popover))",
          "--error-border": "hsl(var(--border))",
          "--error-text": "hsl(var(--popover-foreground))",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
