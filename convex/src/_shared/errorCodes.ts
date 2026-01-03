import { HttpStatusCode } from "@convex/src/_shared/http";

/**
 * Standard error codes for consistent error handling across the API.
 * These are standard HTTP error codes that can be used with optional custom messages.
 */
export class ErrorCodes {
	// Client errors (4xx)
	static readonly BAD_REQUEST = {
		code: "BAD_REQUEST",
		message: "The request is invalid or malformed.",
		status: 400,
	};

	static readonly UNAUTHORIZED = {
		code: "UNAUTHORIZED",
		message: "Authentication is required to access this resource.",
		status: 401,
	};

	static readonly NOT_AUTHENTICATED = {
		code: "NOT_AUTHENTICATED",
		message: "You must be authenticated to access this resource.",
		status: 401,
	};

	static readonly PAYMENT_REQUIRED = {
		code: "PAYMENT_REQUIRED",
		message: "Payment is required to access this resource.",
		status: 402,
	};

	static readonly FORBIDDEN = {
		code: "FORBIDDEN",
		message: "You do not have permission to access this resource.",
		status: 403,
	};

	static readonly NOT_FOUND = {
		code: "NOT_FOUND",
		message: "The requested resource was not found.",
		status: 404,
	};

	static readonly METHOD_NOT_ALLOWED = {
		code: "METHOD_NOT_ALLOWED",
		message: "The requested method is not allowed for this resource.",
		status: 405,
	};

	static readonly NOT_ACCEPTABLE = {
		code: "NOT_ACCEPTABLE",
		message: "The request is not acceptable according to the Accept headers.",
		status: 406,
	};

	static readonly PROXY_AUTHENTICATION_REQUIRED = {
		code: "PROXY_AUTHENTICATION_REQUIRED",
		message: "Proxy authentication is required.",
		status: 407,
	};

	static readonly REQUEST_TIMEOUT = {
		code: "REQUEST_TIMEOUT",
		message: "The request timed out.",
		status: 408,
	};

	static readonly CONFLICT = {
		code: "CONFLICT",
		message: "The request conflicts with the current state of the resource.",
		status: 409,
	};

	static readonly GONE = {
		code: "GONE",
		message: "The requested resource is no longer available.",
		status: 410,
	};

	static readonly LENGTH_REQUIRED = {
		code: "LENGTH_REQUIRED",
		message: "The Content-Length header is required for this request.",
		status: 411,
	};

	static readonly PRECONDITION_FAILED = {
		code: "PRECONDITION_FAILED",
		message: "One or more preconditions in the request header fields evaluated to false.",
		status: 412,
	};

	static readonly PAYLOAD_TOO_LARGE = {
		code: "PAYLOAD_TOO_LARGE",
		message: "The request payload is too large.",
		status: 413,
	};

	static readonly URI_TOO_LONG = {
		code: "URI_TOO_LONG",
		message: "The URI provided is too long.",
		status: 414,
	};

	static readonly UNSUPPORTED_MEDIA_TYPE = {
		code: "UNSUPPORTED_MEDIA_TYPE",
		message: "The media format is not supported by the server.",
		status: 415,
	};

	static readonly RANGE_NOT_SATISFIABLE = {
		code: "RANGE_NOT_SATISFIABLE",
		message: "The range specified in the Range header field cannot be fulfilled.",
		status: 416,
	};

	static readonly EXPECTATION_FAILED = {
		code: "EXPECTATION_FAILED",
		message: "The expectation given in the Expect header field could not be met.",
		status: 417,
	};

	static readonly IM_A_TEAPOT = {
		code: "IM_A_TEAPOT",
		message: "I'm a teapot.",
		status: 418,
	};

	static readonly MISDIRECTED_REQUEST = {
		code: "MISDIRECTED_REQUEST",
		message: "The request was directed to a server that is not able to produce a response.",
		status: 421,
	};

	static readonly UNPROCESSABLE_ENTITY = {
		code: "UNPROCESSABLE_ENTITY",
		message: "The request was well-formed but contains semantic errors.",
		status: 422,
	};

	static readonly VALIDATION_ERROR = {
		code: "VALIDATION_ERROR",
		message: "The request data failed validation.",
		status: 422,
	};

	static readonly LOCKED = {
		code: "LOCKED",
		message: "The resource is locked and cannot be modified.",
		status: 423,
	};

	static readonly FAILED_DEPENDENCY = {
		code: "FAILED_DEPENDENCY",
		message: "The request failed due to failure of a previous request.",
		status: 424,
	};

	static readonly TOO_EARLY = {
		code: "TOO_EARLY",
		message: "The server is unwilling to risk processing a request that might be replayed.",
		status: 425,
	};

	static readonly UPGRADE_REQUIRED = {
		code: "UPGRADE_REQUIRED",
		message: "The server refuses to perform the request using the current protocol.",
		status: 426,
	};

	static readonly PRECONDITION_REQUIRED = {
		code: "PRECONDITION_REQUIRED",
		message: "The origin server requires the request to be conditional.",
		status: 428,
	};

	static readonly TOO_MANY_REQUESTS = {
		code: "TOO_MANY_REQUESTS",
		message: "Too many requests have been sent in a given amount of time.",
		status: 429,
	};

	static readonly REQUEST_HEADER_FIELDS_TOO_LARGE = {
		code: "REQUEST_HEADER_FIELDS_TOO_LARGE",
		message: "The server is unwilling to process the request due to its header fields being too large.",
		status: 431,
	};

	static readonly UNAVAILABLE_FOR_LEGAL_REASONS = {
		code: "UNAVAILABLE_FOR_LEGAL_REASONS",
		message: "The resource is unavailable for legal reasons.",
		status: 451,
	};

	// Server errors (5xx)
	static readonly INTERNAL_ERROR = {
		code: "INTERNAL_ERROR",
		message: "An internal server error occurred.",
		status: 500,
	};

	static readonly NOT_IMPLEMENTED = {
		code: "NOT_IMPLEMENTED",
		message: "The server does not support the functionality required to fulfill the request.",
		status: 501,
	};

	static readonly BAD_GATEWAY = {
		code: "BAD_GATEWAY",
		message: "The server received an invalid response from an upstream server.",
		status: 502,
	};

	static readonly SERVICE_UNAVAILABLE = {
		code: "SERVICE_UNAVAILABLE",
		message: "The service is temporarily unavailable.",
		status: 503,
	};

	static readonly GATEWAY_TIMEOUT = {
		code: "GATEWAY_TIMEOUT",
		message: "The server did not receive a timely response from an upstream server.",
		status: 504,
	};

	static readonly HTTP_VERSION_NOT_SUPPORTED = {
		code: "HTTP_VERSION_NOT_SUPPORTED",
		message: "The HTTP version used in the request is not supported by the server.",
		status: 505,
	};

	static readonly VARIANT_ALSO_NEGOTIATES = {
		code: "VARIANT_ALSO_NEGOTIATES",
		message: "The server has an internal configuration error.",
		status: 506,
	};

	static readonly INSUFFICIENT_STORAGE = {
		code: "INSUFFICIENT_STORAGE",
		message: "The server is unable to store the representation needed to complete the request.",
		status: 507,
	};

	static readonly LOOP_DETECTED = {
		code: "LOOP_DETECTED",
		message: "The server detected an infinite loop while processing the request.",
		status: 508,
	};

	static readonly NOT_EXTENDED = {
		code: "NOT_EXTENDED",
		message: "Further extensions to the request are required for the server to fulfill it.",
		status: 510,
	};

	static readonly NETWORK_AUTHENTICATION_REQUIRED = {
		code: "NETWORK_AUTHENTICATION_REQUIRED",
		message: "The client needs to authenticate to gain network access.",
		status: 511,
	};
}

/**
 * Helper function that logs the error and returns error data.
 * Use this when you want to capture/log the error (for unexpected errors).
 */
export async function logAndReturnError(
	ctx: any, // Convex context (MutationCtx, ActionCtx, or Hono context)
	errorCode: (typeof ErrorCodes)[keyof typeof ErrorCodes],
	customMessage?: string,
	details?: Record<string, any>,
	context?: {
		userId?: string;
		requestId?: string;
		endpoint?: string;
		method?: string;
	},
) {
	const message = customMessage || (errorCode as { message: string }).message;

	// Schedule PostHog error logging as background job.
	if (ctx.scheduler) {
		// Convex function context - use scheduler directly.
		await ctx.scheduler.runAfter(0, "src/internal/logging/logging:sendToPostHog", {
			message,
			code: (errorCode as { code: string }).code,
			status: (errorCode as { status: number }).status,
			details,
			context,
		});
	} else if (ctx.env?.scheduler) {
		// Hono context - scheduler is available through c.env.scheduler.
		await ctx.env.scheduler.runAfter(0, "src/internal/logging/logging:sendToPostHog", {
			message,
			code: (errorCode as { code: string }).code,
			status: (errorCode as { status: number }).status,
			details,
			context,
		});
	}

	return {
		error: message,
		code: (errorCode as { code: string }).code,
		status: (errorCode as { status: number }).status as HttpStatusCode,
		details,
	};
}
