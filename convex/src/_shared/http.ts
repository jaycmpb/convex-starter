import { z } from "zod";

/**
 * HTTP status codes that Hono accepts for responses.
 */
export type HttpStatusCode =
  | 400
  | 401
  | 403
  | 404
  | 409
  | 422
  | 429
  | 500
  | 502
  | 503
  | 504
  | 507
  | 508
  | 510
  | 511;

/**
 * Standard response schemas for OpenAPI documentation.
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  status: z.number(),
  details: z.any().optional(),
});

export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  message: z.string().optional(),
});
