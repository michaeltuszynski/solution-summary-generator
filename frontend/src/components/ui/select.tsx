import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { ChevronDown, ChevronUp, Check } from "lucide-react"

import { cn } from "../../lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={className}
    style={{
      display: 'flex',
      height: '40px',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: '6px',
      border: '1px solid var(--medium-gray)',
      backgroundColor: 'var(--primary-white)',
      padding: '8px 12px',
      fontSize: '14px',
      cursor: 'pointer',
      outline: 'none',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
      ...props.style
    }}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown style={{ height: '16px', width: '16px', opacity: 0.5 }} />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={className}
      position={position}
      style={{
        zIndex: 50,
        maxHeight: '384px',
        minWidth: 'var(--radix-select-trigger-width)',
        overflow: 'hidden',
        borderRadius: '6px',
        border: '1px solid var(--medium-gray)',
        backgroundColor: 'var(--primary-white)',
        color: 'var(--primary-black)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        animation: 'none',
        transition: 'none',
        transform: 'none',
        ...props.style
      }}
      sideOffset={4}
      {...props}
    >
      <SelectPrimitive.Viewport style={{ padding: '4px' }}>
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={className}
    style={{
      position: 'relative',
      display: 'flex',
      width: '100%',
      cursor: 'pointer',
      userSelect: 'none',
      alignItems: 'center',
      borderRadius: '4px',
      padding: '8px 12px 8px 8px',
      fontSize: '14px',
      outline: 'none',
      margin: '2px',
      transition: 'background-color 0.15s ease, color 0.15s ease',
      ...props.style
    }}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <span style={{ 
      position: 'absolute', 
      right: '8px', 
      display: 'flex', 
      height: '14px', 
      width: '14px', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <SelectPrimitive.ItemIndicator>
        <Check style={{ height: '16px', width: '16px' }} />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-100", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
