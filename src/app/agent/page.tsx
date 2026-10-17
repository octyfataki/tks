import { redirect } from "next/navigation";
import { DESTINATION_AGENT } from "@/lib/accounts/session-role";

export default function AgentIndexPage() {
  redirect(`${DESTINATION_AGENT}/dashboard`);
}
