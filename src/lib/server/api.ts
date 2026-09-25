import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { AuthError } from "./auth";
import { OrderError } from "./orders";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/** Envolve um handler tratando erros conhecidos sem vazar detalhes internos. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof AuthError) return fail(e.status, e.message);
      if (e instanceof OrderError) return fail(422, e.message);
      if (e instanceof HttpError) return fail(e.status, e.message);
      if (e instanceof ZodError) return fail(422, e.issues[0]?.message || "Dados inválidos.");
      console.error(e);
      return fail(500, "Erro interno. Tente novamente.");
    }
  };
}

export async function readJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Requisição inválida.");
  }
  return schema.parse(body);
}

export function idParam(v: string): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, "ID inválido.");
  return n;
}
