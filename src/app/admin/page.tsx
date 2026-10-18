import { redirect } from "next/navigation";
import { DESTINATION_ADMIN } from "@/lib/accounts/session-role";

export default function AdminIndexPage() {
  redirect(`${DESTINATION_ADMIN}/dashboard`);
}
