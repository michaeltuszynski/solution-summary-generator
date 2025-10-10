'use client'

import * as React from "react"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => (
  <div
    ref={ref}
    className={className}
    style={{
      borderRadius: '8px',
      border: '1px solid var(--light-gray)',
      backgroundColor: 'var(--primary-white)',
      color: 'var(--primary-black)',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      ...style
    }}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => (
  <div 
    ref={ref} 
    className={className} 
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      padding: '24px',
      ...style
    }} 
    {...props} 
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, style, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={className}
    style={{
      fontFamily: 'var(--font-heading)',
      fontWeight: '600',
      lineHeight: '1',
      letterSpacing: '-0.025em',
      color: 'var(--dark-gray)',
      ...style
    }}
    {...props}
  >
    {children}
  </h3>
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, style, ...props }, ref) => (
  <p 
    ref={ref} 
    className={className} 
    style={{
      fontSize: '14px',
      color: 'var(--medium-gray)',
      fontFamily: 'var(--font-body)',
      ...style
    }} 
    {...props} 
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => (
  <div 
    ref={ref} 
    className={className} 
    style={{
      padding: '24px',
      paddingTop: '0',
      ...style
    }} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => (
  <div 
    ref={ref} 
    className={className} 
    style={{
      display: 'flex',
      alignItems: 'center',
      padding: '24px',
      paddingTop: '0',
      ...style
    }} 
    {...props} 
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
