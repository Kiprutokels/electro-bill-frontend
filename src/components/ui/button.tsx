import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary/50",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/50",
        outline:
          "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary/50",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent/50",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-primary/50",
        success: "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600/50 dark:bg-green-500 dark:hover:bg-green-600",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700 focus-visible:ring-yellow-600/50 dark:bg-yellow-500 dark:hover:bg-yellow-600",
      },
      size: {
        default: "h-10 px-4 py-2 text-responsive-sm",
        sm: "h-8 sm:h-9 rounded-md px-2 sm:px-3 text-responsive-sm",
        lg: "h-11 sm:h-12 rounded-md px-6 sm:px-8 text-responsive-base",
        icon: "h-8 w-8 sm:h-10 sm:w-10",
        "icon-sm": "h-7 w-7 sm:h-8 sm:w-8",
        "icon-lg": "h-10 w-10 sm:h-12 sm:w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
