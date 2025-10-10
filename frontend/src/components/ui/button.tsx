'use client'

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"


const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white shadow hover:bg-blue-700",
        destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600",
        outline: "border border-gray-300 bg-white shadow-sm hover:bg-gray-50 hover:text-gray-900",
        secondary: "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
  ({ className, variant = "default", size = "default", asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Base button styles
    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      fontFamily: 'var(--font-heading)',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      cursor: 'pointer',
      border: 'none',
      outline: 'none',
      ...style
    }
    
    // Define variant styles
    const getVariantStyles = (variant: string): React.CSSProperties => {
      switch (variant) {
        case 'outline':
          return {
            backgroundColor: 'transparent',
            color: 'var(--primary-blue)',
            border: '2px solid var(--primary-blue)'
          }
        case 'secondary':
          return {
            backgroundColor: 'var(--light-gray)',
            color: 'var(--dark-gray)'
          }
        case 'ghost':
          return {
            backgroundColor: 'transparent',
            color: 'var(--dark-gray)'
          }
        case 'destructive':
          return {
            backgroundColor: '#ef4444',
            color: 'var(--primary-white)'
          }
        case 'link':
          return {
            backgroundColor: 'transparent',
            color: 'var(--primary-blue)',
            textDecoration: 'underline',
            textUnderlineOffset: '4px'
          }
        default:
          return {
            backgroundColor: 'var(--primary-blue)',
            color: 'var(--primary-white)',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }
      }
    }
    
    // Define size styles
    const getSizeStyles = (size: string): React.CSSProperties => {
      switch (size) {
        case 'sm':
          return {
            height: '32px',
            padding: '6px 12px',
            fontSize: '12px'
          }
        case 'lg':
          return {
            height: '48px',
            padding: '12px 32px',
            fontSize: '16px'
          }
        case 'icon':
          return {
            height: '40px',
            width: '40px',
            padding: '0'
          }
        default:
          return {
            height: '40px',
            padding: '8px 16px'
          }
      }
    }
    
    const variantStyles = getVariantStyles(variant || 'default')
    const sizeStyles = getSizeStyles(size || 'default')
    
    return (
      <Comp
        className={className}
        style={{
          ...baseStyles,
          ...variantStyles,
          ...sizeStyles
        }}
        ref={ref}
        onMouseEnter={(e) => {
          if (variant === 'default') {
            e.currentTarget.style.backgroundColor = '#007ba3'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 147, 201, 0.3)'
          } else if (variant === 'outline') {
            e.currentTarget.style.backgroundColor = 'var(--primary-blue)'
            e.currentTarget.style.color = 'var(--primary-white)'
          }
          props.onMouseEnter?.(e)
        }}
        onMouseLeave={(e) => {
          if (variant === 'default') {
            e.currentTarget.style.backgroundColor = 'var(--primary-blue)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          } else if (variant === 'outline') {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--primary-blue)'
          }
          props.onMouseLeave?.(e)
        }}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
