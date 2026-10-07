"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

export type NavSubItem = {
  title: string
  url?: string
  soon?: boolean
}

export type NavItem = {
  title: string
  url: string
  icon?: React.ReactNode
  isActive?: boolean
  soon?: boolean
  items?: NavSubItem[]
}

function SoonBadge() {
  return (
    <span className="ml-auto shrink-0 rounded-full border px-1.5 py-px text-[10px] font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">
      Bientôt
    </span>
  )
}

export function NavMain({
  label,
  items,
}: {
  label: string
  items: NavItem[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-semibold tracking-wider uppercase">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          if (!item.items?.length) {
            return (
              <SidebarMenuItem key={item.title}>
                {item.soon ? (
                  <SidebarMenuButton
                    tooltip={item.title}
                    aria-disabled
                    className="cursor-default"
                  >
                    {item.icon}
                    <span>{item.title}</span>
                    <SoonBadge />
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={pathname === item.url}
                    render={<Link href={item.url} />}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            )
          }
          const groupeActif =
            pathname === item.url ||
            item.items.some((subItem) => subItem.url === pathname)
          // Groupe « Bientôt » (sans destination) : simple déplieur, aucun lien.
          if (item.soon) {
            return (
              <Collapsible
                key={item.title}
                defaultOpen={item.isActive}
                className="group/collapsible"
                render={<SidebarMenuItem />}
              >
                <CollapsibleTrigger
                  render={<SidebarMenuButton tooltip={item.title} />}
                >
                  {item.icon}
                  <span>{item.title}</span>
                  <SoonBadge />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <span className="flex h-7 min-w-0 -translate-x-px items-center justify-between gap-2 overflow-hidden rounded-md px-2 text-xs text-muted-foreground">
                          <span className="truncate">{subItem.title}</span>
                          <span className="shrink-0 rounded-full border px-1.5 py-px text-[10px] font-medium">
                            Bientôt
                          </span>
                        </span>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            )
          }
          // Groupe avec destination : le libellé navigue vers item.url, le
          // chevron déplie le sous-menu. Avant, tout le parent n'était qu'un
          // déplieur et son url était ignorée (clic sans redirection).
          return (
            <Collapsible
              key={item.title}
              defaultOpen={item.isActive || groupeActif}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <div className="flex w-full items-center gap-1">
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={pathname === item.url}
                  render={<Link href={item.url} />}
                  className="min-w-0 flex-1"
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
                <CollapsibleTrigger
                  aria-label={`Déplier ${item.title}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-[calc(var(--radius-sm)+2px)] text-sidebar-foreground outline-hidden transition-[background-color,color] group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                >
                  <ChevronRightIcon className="size-4 transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      {subItem.soon || !subItem.url ? (
                        <span className="flex h-7 min-w-0 -translate-x-px items-center justify-between gap-2 overflow-hidden rounded-md px-2 text-xs text-muted-foreground">
                          <span className="truncate">{subItem.title}</span>
                          <span className="shrink-0 rounded-full border px-1.5 py-px text-[10px] font-medium">
                            Bientôt
                          </span>
                        </span>
                      ) : (
                        <SidebarMenuSubButton
                          isActive={pathname === subItem.url}
                          render={<Link href={subItem.url} />}
                        >
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      )}
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
