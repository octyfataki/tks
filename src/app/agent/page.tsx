import { redirect } from "next/navigation";
import { DESTINATION_AGENT } from "@/lib/s1-comptes/role-session";

export default function AgentIndexPage() {
  redirect(`${DESTINATION_AGENT}/dashboard`);
}