import { adminDb, requireStaff, fail } from "@/lib/server/admin";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireStaff(request);
    const db = adminDb();
    const [admins, managers] = await Promise.all([
      db.collection("users").where("role", "==", "admin").limit(200).get(),
      db.collection("users").where("role", "==", "manager").limit(200).get()
    ]);
    const unique = new Map();
    for (const snap of [...admins.docs, ...managers.docs]) {
      const user = snap.data();
      if (["blocked", "disabled"].includes(user.status)) continue;
      unique.set(snap.id, {
        uid: snap.id,
        displayName: user.displayName || "Utilisateur " + snap.id,
        role: user.role
      });
    }
    return Response.json({ staff: [...unique.values()].sort((a, b) => a.displayName.localeCompare(b.displayName)) });
  } catch (error) { return fail(error); }
}
