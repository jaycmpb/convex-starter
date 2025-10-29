import { action } from "@convex/_generated/server";
import { v } from "convex/values";

/**
 * Action to send error data to PostHog.
 * This runs in the background and doesn't block the main request.
 */
export const sendToPostHog = action({
  args: {
    message: v.string(),
    stack: v.optional(v.string()),
    code: v.optional(v.string()),
    status: v.optional(v.number()),
    details: v.optional(v.any()),
    context: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    if (!process.env.POSTHOG_API_KEY) {
      // console.log("PostHog API key not configured, skipping error logging.");
      return;
    }

    try {
      const payload = {
        api_key: process.env.POSTHOG_API_KEY,
        event: "$exception",
        properties: {
          distinct_id: "server",
          $exception_list: [
            {
              type: "APIError",
              value: args.message,
              mechanism: {
                handled: true,
                synthetic: false,
              },
              stacktrace: {
                type: "raw",
                frames: [
                  {
                    platform: "custom",
                    lang: "javascript",
                    function: "logAndReturnError",
                    filename: "errorCodes.ts",
                    lineno: 1,
                    colno: 1,
                    module: "convex-error-handling",
                    resolved: true,
                    in_app: true,
                  },
                ],
              },
            },
          ],
          $exception_fingerprint: args.code || "unknown",
          error_code: args.code,
          status_code: args.status,
          details: args.details,
          context: args.context,
          timestamp: new Date().toISOString(),
        },
      };

      const posthogEndpoint =
        process.env.POSTHOG_ENDPOINT || "https://us.i.posthog.com/i/v0/e/";
      const response = await fetch(posthogEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log(
        `PostHog error sent successfully with status ${response.status}.`
      );
      if (response.status !== 200) {
        const errorText = await response.text();
        console.log("PostHog error response:", errorText);
      }
    } catch (err) {
      console.error("PostHog error:", err);
    }
  },
});
