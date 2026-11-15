import * as Tooltip from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

export function Hint({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="tip" sideOffset={6}>{label}</Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
