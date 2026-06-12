import { requireUser } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) throw new ApiError("Réservé à l'administrateur.", 403);
  return user;
}
