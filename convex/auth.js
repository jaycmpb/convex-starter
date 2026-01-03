import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTP } from "@convex/src/resend/actions";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [ResendOTP],
});
