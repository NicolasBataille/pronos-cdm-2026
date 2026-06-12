import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type infer as zInfer } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data, error: null }, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, data: null, error: message }, { status });
}

export async function parseBody<S extends ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<zInfer<S>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError("Corps de requête invalide (JSON attendu).", 400);
  }
  try {
    return schema.parse(json) as zInfer<S>;
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ApiError(err.issues[0]?.message ?? "Données invalides.", 422);
    }
    throw err;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/** Enveloppe un handler pour transformer les ApiError/Response en réponses propres. */
export function handler(fn: (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return fail(err.message, err.status);
      if (err instanceof Response) return err;
      console.error("[api] erreur non gérée:", err);
      return fail("Erreur interne du serveur.", 500);
    }
  };
}
