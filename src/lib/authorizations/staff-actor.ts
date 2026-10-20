import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/accounts";
import { aPermission } from "./permissions";

export { estRoleAdmin } from "@/lib/db/schema/accounts";

export type StaffAccount = {
  id: string;
  role: string;
  state: string;
};

export type StaffActor = {
  id: string;
  role: string;
};

export async function currentStaffAccount(): Promise<StaffAccount | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return null;
  const lignes = await db
    .select({
      id: comptesStaff.id,
      role: comptesStaff.role,
      etat: comptesStaff.etat,
    })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  const compte = lignes[0];
  if (!compte || compte.etat !== "VALIDE") return null;
  return { id: compte.id, role: compte.role, state: compte.etat };
}

export async function staffActorWith(
  permission: string,
): Promise<StaffActor | null> {
  const compte = await currentStaffAccount();
  if (!compte) return null;
  if (!(await aPermission(compte.id, permission))) return null;
  return { id: compte.id, role: compte.role };
}

export async function staffActorWithAny(
  permissions: readonly string[],
): Promise<StaffActor | null> {
  const compte = await currentStaffAccount();
  if (!compte) return null;
  for (const permission of permissions) {
    if (await aPermission(compte.id, permission)) {
      return { id: compte.id, role: compte.role };
    }
  }
  return null;
}
