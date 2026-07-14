"use client";

import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@meridian/ui-web/components/alert";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function LoginPage() {
	const [showSignIn, setShowSignIn] = useState(true);
	const searchParams = useSearchParams();
	const returnTo = searchParams.get("returnTo");
	const wasRevoked = searchParams.get("reason") === "session-revoked";

	return (
		<div>
			{wasRevoked ? (
				<Alert className="mx-auto mt-6 max-w-md" role="status">
					<AlertTitle>Session revoked</AlertTitle>
					<AlertDescription>
						Sign in again if you still need access on this device.
					</AlertDescription>
				</Alert>
			) : null}
			{showSignIn ? (
				<SignInForm
					onSwitchToSignUp={() => setShowSignIn(false)}
					returnTo={returnTo}
				/>
			) : (
				<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
			)}
		</div>
	);
}
