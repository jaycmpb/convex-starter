"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
	const router = useRouter();
	const { signIn } = useAuthActions();

	const [step, setStep] = useState<"email" | "otp">("email");
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSendOTP = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			await signIn("resend-otp", { email });
			setStep("otp");
		} catch {
			setError("Failed to send OTP. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerifyOTP = async (e: React.FormEvent) => {
		e.preventDefault();

		if (otp.length !== 6) {
			setError("Please enter a 6-digit code.");
			return;
		}

		setError(null);
		setIsLoading(true);

		try {
			await signIn("resend-otp", { email, code: otp });
			router.push("/dashboard");
		} catch {
			setError("Invalid or expired code. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Login</CardTitle>
					<CardDescription>
						{step === "email" ? "Enter your email address to receive a verification code." : "Enter the 6-digit code sent to your email."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{step === "email" ? (
						<form onSubmit={handleSendOTP} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="you@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									disabled={isLoading}
								/>
							</div>
							{error && <p className="text-sm text-destructive">{error}</p>}
							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? (
									<>
										<Spinner className="mr-2" />
										Sending...
									</>
								) : (
									"Send Code"
								)}
							</Button>
						</form>
					) : (
						<form onSubmit={handleVerifyOTP} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="otp">Verification Code</Label>
								<InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={isLoading}>
									<InputOTPGroup>
										<InputOTPSlot index={0} />
										<InputOTPSlot index={1} />
										<InputOTPSlot index={2} />
										<InputOTPSlot index={3} />
										<InputOTPSlot index={4} />
										<InputOTPSlot index={5} />
									</InputOTPGroup>
								</InputOTP>
								<p className="text-xs text-muted-foreground">Code sent to {email}</p>
							</div>
							{error && <p className="text-sm text-destructive">{error}</p>}
							<div className="flex flex-col gap-2">
								<Button type="submit" className="grow" disabled={isLoading || otp.length !== 6}>
									{isLoading ? (
										<>
											<Spinner className="mr-2" />
											Verifying...
										</>
									) : (
										"Verify Code"
									)}
								</Button>
								<Button
									type="button"
									variant="outline"
									className="grow"
									onClick={() => {
										setStep("email");
										setOtp("");
										setError(null);
									}}
									disabled={isLoading}
								>
									Back
								</Button>
							</div>
						</form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
