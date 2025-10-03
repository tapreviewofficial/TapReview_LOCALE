import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Apple-style toggle: larger size, smooth transitions, luxury gold theme
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 ease-in-out",
      // Focus states
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CC9900]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      // Disabled states
      "disabled:cursor-not-allowed disabled:opacity-50",
      // Active state - luxury gold with subtle glow
      "data-[state=checked]:bg-[#CC9900] data-[state=checked]:shadow-[0_0_12px_rgba(204,153,0,0.3)]",
      // Inactive state - dark with subtle border
      "data-[state=unchecked]:bg-zinc-700/60 data-[state=unchecked]:border-zinc-600/50",
      // Apple-like inset shadow
      "shadow-[inset_0_1px_3px_rgba(0,0,0,0.25)]",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Apple-style thumb: white with drop shadow, smooth movement
        "pointer-events-none block h-6 w-6 rounded-full bg-white transition-transform duration-200 ease-in-out",
        // Drop shadow for depth
        "shadow-[0_1px_3px_rgba(0,0,0,0.4),0_1px_8px_rgba(0,0,0,0.15)]",
        // Transform positions - adjusted for larger switch
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
