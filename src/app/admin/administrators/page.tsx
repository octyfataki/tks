import { redirect } from "next/navigation";

// Ancienne adresse unique, conservée en redirection : la section est
// désormais découpée en /admin/list, /admin/create et /admin/invitation.
export default function AnciensAdministrateurs() {
  redirect("/admin/list");
}
