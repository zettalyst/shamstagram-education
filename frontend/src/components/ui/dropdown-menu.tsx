/**
 * Dropdown Menu UI 컴포넌트
 */

import * as React from "react"

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  return <div className="relative inline-block text-left">{children}</div>
}

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  if (asChild) {
    return React.cloneElement(children as React.ReactElement, { ref, ...props })
  }
  
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'end' }
>(({ className, align = 'start', children, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const alignClass = align === 'end' ? 'right-0' : 'left-0'
  
  return (
    <div
      ref={ref}
      className={`absolute z-50 mt-2 ${alignClass} min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-md ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 ${className || ''}`}
    {...props}
  />
))
DropdownMenuItem.displayName = "DropdownMenuItem"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}