"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth-client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { toast } from "@/components/ui/toast"
import { ChevronsUpDownIcon, BadgeCheckIcon, BellIcon, LogOutIcon } from "lucide-react"

export function NavUser({
  user,
  profilUrl,
}: {
  user: {
    name: string
    email: string
    avatar?: string
  }
  /** Destination de « Mon compte ». Sans elle, l'entrée reste inerte. */
  profilUrl?: string
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [deconnexionEnCours, setDeconnexionEnCours] = React.useState(false)
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar>
              {user.avatar ? (
                <AvatarImage src={user.avatar} alt={user.name} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} alt={user.name} />
                    ) : null}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={!profilUrl}
                onClick={() => {
                  if (profilUrl) router.push(profilUrl)
                }}
              >
                <BadgeCheckIcon
                />
                Mon compte
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon
                />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={deconnexionEnCours}
              onClick={async () => {
                if (deconnexionEnCours) return
                setDeconnexionEnCours(true)
                try {
                  await signOut()
                  toast.add({ type: "success", title: "Déconnexion réussie" })
                  router.push("/sign-in")
                  router.refresh()
                } catch {
                  toast.add({
                    type: "error",
                    title: "Échec de la déconnexion",
                    description: "Réessayez.",
                  })
                } finally {
                  setDeconnexionEnCours(false)
                }
              }}
            >
              <LogOutIcon
              />
              {deconnexionEnCours ? "Déconnexion…" : "Se déconnecter"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
