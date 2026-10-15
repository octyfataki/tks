import { redirect } from "next/navigation";
import { DESTINATION_ADMIN } from "@/lib/s1-comptes/role-session";

export default function AdminIndexPage() {
  redirect(`${DESTINATION_ADMIN}/dashboard`);
}
