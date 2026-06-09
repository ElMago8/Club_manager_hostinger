import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onClick, onFocus, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const isNativePickerInput = type === "date" || type === "time" || type === "datetime-local" || type === "month" || type === "week"

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    function openNativePicker(event: React.MouseEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) {
      const input = event.currentTarget

      if (!isNativePickerInput || input.disabled || input.readOnly) return
      if (typeof input.showPicker !== "function") return

      try {
        input.showPicker()
      } catch {
        // Some browsers only allow showPicker from direct pointer activation.
      }
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background/70 px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-muted/35 dark:shadow-[0_0_0_1px_color-mix(in_oklch,var(--input)_45%,transparent)] md:text-sm",
          isNativePickerInput && "cursor-pointer pr-10",
          className
        )}
        ref={inputRef}
        onClick={(event) => {
          onClick?.(event)
          if (!event.defaultPrevented) openNativePicker(event)
        }}
        onFocus={(event) => {
          onFocus?.(event)
          if (!event.defaultPrevented) openNativePicker(event)
        }}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
