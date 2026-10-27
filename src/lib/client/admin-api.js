import { auth } from "@/firebase";
export async function adminApi(path, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Connexion requise");
  const token = await user.getIdToken();
  const response = await fetch(path, {
    ...options,
    headers: { Authorization: "Bearer " + token, ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Opération refusée");
  return data;
}
