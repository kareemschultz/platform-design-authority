import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdministrationNavigation } from "@/components/administration-navigation";
import { WorkspaceProvider } from "@/components/workspace-context";
import { authClient } from "@/lib/auth-client";

export default async function AdministrationLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await authClient.getSession({
		fetchOptions: { headers: await headers(), throw: true },
	});
	if (!session?.user) {
		redirect("/login?returnTo=/administration");
	}
	return (
		<WorkspaceProvider>
			<AdministrationNavigation />
			{children}
		</WorkspaceProvider>
	);
}
