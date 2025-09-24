import * as React from "react"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <textarea
        className={className}
        style={{
          display: 'flex',
          minHeight: '100px',
          width: '100%',
          borderRadius: '6px',
          border: '1px solid var(--medium-gray)',
          backgroundColor: 'var(--primary-white)',
          padding: '8px 12px',
          fontSize: '14px',
          fontFamily: 'var(--font-body)',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s ease',
          outline: 'none',
          resize: 'vertical',
          ...style
        }}
        ref={ref}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--primary-blue)'
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 147, 201, 0.1)'
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--medium-gray)'
          e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          props.onBlur?.(e)
        }}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
