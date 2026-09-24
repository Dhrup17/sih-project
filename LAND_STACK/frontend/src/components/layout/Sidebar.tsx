import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  isOpen?: boolean
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, isOpen = true, children, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(
        'fixed left-0 top-0 bottom-0 w-64 z-40 flex-shrink-0 transition-transform transform bg-black/80 backdrop-blur-md border-r border-border overflow-y-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
)
Sidebar.displayName = 'Sidebar'

export { Sidebar }