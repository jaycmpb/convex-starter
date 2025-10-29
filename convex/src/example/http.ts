import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { ActionCtx } from "@convex/_generated/server";
import { ErrorCodes, logAndReturnError } from "@convex/src/_shared/errorCodes";
import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from "@convex/src/_shared/http";
import { HonoWithConvex } from "convex-helpers/server/hono";
import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "zod";

const app: HonoWithConvex<ActionCtx> = new Hono();

/**
 * GET /counters - Get all counters.
 */
app.get(
  "/counters",
  describeRoute({
    tags: ["Counters"],
    description: "Retrieves all counters from the database.",
    responses: {
      200: {
        description: "Successfully Retrieved All Counters",
        content: {
          "application/json": {
            schema: resolver(
              SuccessResponseSchema.extend({
                data: z.array(
                  z.object({
                    _id: z.string(),
                    name: z.string(),
                    value: z.number(),
                    createdAt: z.number(),
                    updatedAt: z.number(),
                  })
                ),
              })
            ),
          },
        },
      },
      500: {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema),
          },
        },
      },
    },
  }),
  async (c) => {
    try {
      const counters = await c.env.runQuery(
        api.src.example.queries.getAllCounters
      );
      return c.json({ success: true, data: counters });
    } catch (error) {
      const errorData = await logAndReturnError(
        c,
        ErrorCodes.INTERNAL_ERROR,
        "Failed to retrieve counters."
      );
      return c.json(errorData, errorData.status);
    }
  }
);

/**
 * GET /counters/:name - Get a counter by name.
 */
app.get(
  "/counters/:name",
  describeRoute({
    tags: ["Counters"],
    description: "Retrieves a specific counter by its name.",
    parameters: [
      {
        name: "name",
        in: "path",
        required: true,
        description: "The name of the counter to retrieve.",
        schema: {
          type: "string",
        },
        example: "my-counter",
      },
    ],
    responses: {
      200: {
        description: "Successfully Retrieved Counter",
        content: {
          "application/json": {
            schema: resolver(
              SuccessResponseSchema.extend({
                data: z.object({
                  _id: z.string(),
                  name: z.string(),
                  value: z.number(),
                  createdAt: z.number(),
                  updatedAt: z.number(),
                }),
              })
            ),
          },
        },
      },
      404: {
        description: "Counter Not Found",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema),
          },
        },
      },
      500: {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema),
          },
        },
      },
    },
  }),
  async (c) => {
    const name = c.req.param("name");

    try {
      const counter = await c.env.runQuery(
        api.src.example.queries.getCounterByName,
        {
          name,
        }
      );

      if (!counter) {
        return c.json(
          { ...ErrorCodes.NOT_FOUND, message: "Counter not found." },
          ErrorCodes.NOT_FOUND.status as any
        );
      }

      return c.json({ success: true, data: counter });
    } catch (error) {
      const errorData = await logAndReturnError(
        c,
        ErrorCodes.INTERNAL_ERROR,
        "Failed to retrieve counter."
      );
      return c.json(errorData, errorData.status);
    }
  }
);

/**
 * POST /counters - Create a new counter.
 */
app.post(
  "/counters",
  describeRoute({
    tags: ["Counters"],
    description:
      "Creates a new counter with the specified name and optional initial value.",
    responses: {
      201: {
        description: "Successfully Created Counter",
        content: {
          "application/json": {
            schema: resolver(
              SuccessResponseSchema.extend({
                data: z.object({
                  id: z.string(),
                }),
              })
            ),
          },
        },
      },
      400: {
        description: "Bad Request",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema),
          },
        },
      },
      409: {
        description: "Counter Already Exists",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema),
          },
        },
      },
      500: {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema),
          },
        },
      },
    },
  }),
  validator(
    "json",
    z.object({
      name: z.string().min(1, "Name is required."),
      value: z.number().optional(),
    })
  ),
  async (c) => {
    const { name, value } = c.req.valid("json");

    try {
      const counterId = await c.env.runMutation(
        api.src.example.mutations.createCounter,
        {
          name,
          value,
        }
      );

      return c.json({ success: true, data: { id: counterId } }, 201);
    } catch (error) {
      const errorData = await logAndReturnError(
        c,
        ErrorCodes.INTERNAL_ERROR,
        "Failed to create counter."
      );
      return c.json(errorData, errorData.status);
    }
  }
);

/**
 * POST /counters/:id/increment - Increment a counter.
 */
app.post(
  "/counters/:id/increment",
  describeRoute({
    tags: ["Counters"],
    description: "Increments a counter by the specified amount.",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "The ID of the counter to increment.",
        schema: {
          type: "string",
        },
        example: "k1234567890",
      },
    ],
    responses: {
      200: {
        description: "Successfully Incremented Counter",
        content: {
          "application/json": {
            schema: resolver(
              SuccessResponseSchema.extend({
                data: z.object({
                  _id: z.string(),
                  name: z.string(),
                  value: z.number(),
                  createdAt: z.number(),
                  updatedAt: z.number(),
                }),
              })
            ),
          },
        },
      },
      500: {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema),
          },
        },
      },
    },
  }),
  validator(
    "json",
    z.object({
      amount: z.number().optional(),
    })
  ),
  async (c) => {
    const id = c.req.param("id") as Id<"counters">;
    const { amount } = c.req.valid("json");

    try {
      const counter = await c.env.runMutation(
        api.src.example.mutations.incrementCounter,
        {
          id,
          amount,
        }
      );

      return c.json({ success: true, data: counter });
    } catch (error) {
      const errorData = await logAndReturnError(
        c,
        ErrorCodes.INTERNAL_ERROR,
        "Failed to increment counter."
      );
      return c.json(errorData, errorData.status);
    }
  }
);

/**
 * POST /counters/:id/decrement - Decrement a counter.
 */
app.post(
  "/counters/:id/decrement",
  describeRoute({
    tags: ["Counters"],
    description: "Decrements a counter by the specified amount.",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "The ID of the counter to decrement.",
        schema: {
          type: "string",
        },
        example: "k1234567890",
      },
    ],
    responses: {
      200: {
        description: "Successfully Decremented Counter",
        content: {
          "application/json": {
            schema: resolver(
              SuccessResponseSchema.extend({
                data: z.object({
                  _id: z.string(),
                  name: z.string(),
                  value: z.number(),
                  createdAt: z.number(),
                  updatedAt: z.number(),
                }),
              })
            ),
          },
        },
      },
      500: {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema),
          },
        },
      },
    },
  }),
  validator(
    "json",
    z.object({
      amount: z.number().optional(),
    })
  ),
  async (c) => {
    const id = c.req.param("id") as Id<"counters">;
    const { amount } = c.req.valid("json");

    try {
      const counter = await c.env.runMutation(
        api.src.example.mutations.decrementCounter,
        {
          id,
          amount,
        }
      );

      return c.json({ success: true, data: counter });
    } catch (error) {
      const errorData = await logAndReturnError(
        c,
        ErrorCodes.INTERNAL_ERROR,
        "Failed to decrement counter."
      );
      return c.json(errorData, errorData.status);
    }
  }
);

/**
 * POST /counters/:id/reset - Reset a counter to zero.
 */
app.post(
  "/counters/:id/reset",
  describeRoute({
    tags: ["Counters"],
    description: "Resets a counter to zero.",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "The ID of the counter to reset.",
        schema: {
          type: "string",
        },
        example: "k1234567890",
      },
    ],
    responses: {
      200: {
        description: "Successfully Reset Counter",
        content: {
          "application/json": {
            schema: resolver(
              SuccessResponseSchema.extend({
                data: z.object({
                  _id: z.string(),
                  name: z.string(),
                  value: z.number(),
                  createdAt: z.number(),
                  updatedAt: z.number(),
                }),
              })
            ),
          },
        },
      },
      500: {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema),
          },
        },
      },
    },
  }),
  async (c) => {
    const id = c.req.param("id") as Id<"counters">;

    try {
      const counter = await c.env.runMutation(
        api.src.example.mutations.resetCounter,
        {
          id,
        }
      );

      return c.json({ success: true, data: counter });
    } catch (error) {
      const errorData = await logAndReturnError(
        c,
        ErrorCodes.INTERNAL_ERROR,
        "Failed to reset counter."
      );
      return c.json(errorData, errorData.status);
    }
  }
);

/**
 * DELETE /counters/:id - Delete a counter.
 */
app.delete(
  "/counters/:id",
  describeRoute({
    tags: ["Counters"],
    description: "Deletes a counter by its ID.",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "The ID of the counter to delete.",
        schema: {
          type: "string",
        },
        example: "k1234567890",
      },
    ],
    responses: {
      200: {
        description: "Successfully Deleted Counter",
        content: {
          "application/json": {
            schema: resolver(SuccessResponseSchema),
            example: {
              success: true,
              message: "Counter deleted successfully.",
            },
          },
        },
      },
      500: {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema),
            example: {
              success: false,
              error: "Failed to delete counter.",
              code: "INTERNAL_ERROR",
              status: 500,
            },
          },
        },
      },
    },
  }),
  async (c) => {
    const id = c.req.param("id") as Id<"counters">;

    try {
      await c.env.runMutation(api.src.example.mutations.deleteCounter, {
        id,
      });

      return c.json({
        success: true,
        message: "Counter deleted successfully.",
      });
    } catch (error) {
      const errorData = await logAndReturnError(
        c,
        ErrorCodes.INTERNAL_ERROR,
        "Failed to delete counter."
      );
      return c.json(errorData, errorData.status);
    }
  }
);

export default app;
