import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { OperationsNavigation } from "@/components/operations-navigation";
import { WorkspaceProvider } from "@/components/workspace-context";
import { authClient } from "@/lib/auth-client";

export default async function OperationsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await authClient.getSession({
		fetchOptions: { headers: await headers(), throw: true },
	});
	if (!session?.user) {
		redirect("/login?returnTo=/operations");
	}
	return (
		<WorkspaceProvider>
			<OperationsNavigation />
			{children}
		</WorkspaceProvider>
	);
}
