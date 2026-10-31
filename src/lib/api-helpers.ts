import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

import { checkHomeAccess, getCurrentUser } from "@/lib/auth";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "error"
  ) {
    super(message);
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(status: number, message: string, code = "error", extra?: Record<string, unknown>) {
  return NextResponse.json({ error: { code, message, ...extra } }, { status });
}

/**
 * Safely parses a request body against a Zod schema.
 * Throws ApiError(400) with human-readable details when invalid.
 */
export async function parseBody<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.", "invalid_json");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message
    }));
    throw new ApiError(400, "Request validation failed.", "validation_error");
  }
  return parsed.data;
}

/** Parses the numeric id route param. */
export function parseIdParam(param: string | string[] | undefined, name = "id"): string {
  const value = Array.isArray(param) ? param[0] : param;
  if (!value) throw new ApiError(400, `Missing route parameter: ${name}.`, "missing_param");
  return value;
}

type Handler = (request: Request, ctx: { params: Promise<Record<string, string | string[]>> }) => Promise<Response>;

/**
 * Wraps a route handler with consistent error handling + logging.
 * Use: export const GET = withErrorHandling(async (req, ctx) => ...);
 */
export function withErrorHandling(handler: Handler): Handler {
  return async (request, ctx) => {
    try {
      return await handler(request, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return fail(err.status, err.message, err.code);
      }
      if (err instanceof ZodError) {
        return fail(400, "Request validation failed.", "validation_error");
      }
      console.error("[api] unhandled error", err);
      return fail(500, "An internal error occurred.", "internal");
    }
  };
}

/** Requires an authenticated user; returns the user or an error response. */
export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Authentication required.", "unauthenticated");
  return user;
}

/** Requires membership in a home; throws 403 otherwise. */
export async function requireApiHomeAccess(homeId: string) {
  const access = await checkHomeAccess(homeId);
  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      throw new ApiError(401, "Authentication required.", "unauthenticated");
    }
    throw new ApiError(403, "You do not have access to this home.", "forbidden");
  }
  return access;
}

/**
 * Minimal in-memory rate limiter for dev use (per route + IP + user).
 * Production note: replace with a distributed limiter (e.g. Upstash).
 * Returns remaining tokens; throws 429 when exhausted.
 */
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { remaining: limit - 1 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new ApiError(429, "Too many requests. Please slow down.", "rate_limited");
  }
  return { remaining: limit - bucket.count };
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
