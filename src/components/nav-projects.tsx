"use client"

import Link from "next/link"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ArrowRightIcon } from "lucide-react"

export function NavProjects({
  projects,
}: {
  projects: {
    name: string
    detail?: string
    url: string
    icon: React.ReactNode
  }[]
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>À traiter</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton size="lg" render={<Link href={item.url} />}>
              {item.icon}
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate">{item.name}</span>
                {item.detail ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {item.detail}
                  </span>
                ) : null}
              </span>
              <ArrowRightIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
