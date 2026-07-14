"use client";

import { Button } from "@meridian/ui-web/components/button";
import { Input } from "@meridian/ui-web/components/input";
import { Label } from "@meridian/ui-web/components/label";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { safeReturnPath } from "@/lib/shell";

export default function SignInForm({
	onSwitchToSignUp,
	returnTo,
}: {
	onSwitchToSignUp: () => void;
	returnTo?: string | null;
}) {
	const router = useRouter();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
					onSuccess: () => {
						router.push(safeReturnPath(returnTo));
						toast.success("Sign in successful");
					},
				}
			);
		},
		onSubmitInvalid: () => {
			requestAnimationFrame(() => {
				document
					.querySelector<HTMLElement>('#sign-in-form [aria-invalid="true"]')
					?.focus();
			});
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">Welcome Back</h1>

			<form
				className="space-y-4"
				id="sign-in-form"
				noValidate
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<div>
					<form.Field name="email">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Email</Label>
								<Input
									aria-describedby={
										field.state.meta.errors.length > 0
											? `${field.name}-error`
											: undefined
									}
									aria-invalid={field.state.meta.errors.length > 0}
									autoComplete="email"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									type="email"
									value={field.state.value}
								/>
								{field.state.meta.errors.map((error) => (
									<p
										className="text-destructive text-sm"
										id={`${field.name}-error`}
										key={error?.message}
										role="alert"
									>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Password</Label>
								<Input
									aria-describedby={
										field.state.meta.errors.length > 0
											? `${field.name}-error`
											: undefined
									}
									aria-invalid={field.state.meta.errors.length > 0}
									autoComplete="current-password"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									type="password"
									value={field.state.value}
								/>
								{field.state.meta.errors.map((error) => (
									<p
										className="text-destructive text-sm"
										id={`${field.name}-error`}
										key={error?.message}
										role="alert"
									>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							className="min-h-10 w-full"
							disabled={!canSubmit || isSubmitting}
							type="submit"
						>
							{isSubmitting ? "Submitting..." : "Sign In"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className="mt-4 text-center">
				<Button className="min-h-10" onClick={onSwitchToSignUp} variant="link">
					Need an account? Sign Up
				</Button>
			</div>
		</div>
	);
}
