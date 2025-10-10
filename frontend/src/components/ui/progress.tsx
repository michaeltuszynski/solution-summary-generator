'use client'

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, style, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={className}
    style={{
      position: 'relative',
      height: '8px',
      width: '100%',
      overflow: 'hidden',
      borderRadius: '4px',
      backgroundColor: 'var(--light-gray)',
      ...style
    }}
    {...props}
  >
    <ProgressPrimitive.Indicator
      style={{ 
        height: '100%',
        width: '100%',
        flex: '1 1 0%',
        backgroundColor: 'var(--primary-blue)',
        transition: 'all 0.3s ease',
        transform: `translateX(-${100 - (value || 0)}%)` 
      }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
