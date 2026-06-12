export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!json.success) throw new Error(json.error ?? "Erreur");
  return json.data;
}

export async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!json.success) throw new Error(json.error ?? "Erreur");
  return json.data;
}
