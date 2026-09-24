import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, onValueChange, onChange, ...props }, ref) => (
    <div className="relative w-full">
      <select
        ref={ref}
        onChange={(e) => {
          if (onChange) onChange(e)
          if (onValueChange) onValueChange(e.target.value)
        }}
        className={cn(
          'flex h-10 w-full rounded-md border border-border bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
)
Select.displayName = 'Select'

export interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {}

const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ className, children, ...props }, ref) => (
    <option ref={ref} className={cn('bg-zinc-900 text-white', className)} {...props}>
      {children}
    </option>
  )
)
SelectItem.displayName = 'SelectItem'

export { Select, SelectItem }
