"use client";

import { Button } from "@meridian/ui-web/components/button";
import { Input } from "@meridian/ui-web/components/input";
import { Label } from "@meridian/ui-web/components/label";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

export default function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	const router = useRouter();

	const form = useForm({
		defaultValues: {
			email: "",
			name: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					name: value.name,
					password: value.password,
				},
				{
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
					onSuccess: () => {
						router.push("/administration");
						toast.success("Sign up successful");
					},
				}
			);
		},
		onSubmitInvalid: () => {
			document.getElementById("name")?.focus();
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
				name: z.string().min(2, "Name must be at least 2 characters"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">Create Account</h1>

			<form
				className="space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<div>
					<form.Field name="name">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Name</Label>
								<Input
									aria-describedby={
										field.state.meta.errors.length > 0
											? `${field.name}-error`
											: undefined
									}
									aria-invalid={field.state.meta.errors.length > 0}
									autoComplete="name"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
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
									autoComplete="new-password"
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
							{isSubmitting ? "Submitting..." : "Sign Up"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className="mt-4 text-center">
				<Button className="min-h-10" onClick={onSwitchToSignIn} variant="link">
					Already have an account? Sign In
				</Button>
			</div>
		</div>
	);
}
