import agent from "@convex-dev/agent/convex.config";
import resend from "@convex-dev/resend/convex.config.js";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(agent);
app.use(resend);
export default app;
