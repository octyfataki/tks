import type { ReactNode } from "react";
import { AppFooter } from "@/components/app-footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      {children}
      <AppFooter />
    </div>
  );
}
