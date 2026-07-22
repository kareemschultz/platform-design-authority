import { PosNavigation } from "@/components/pos-navigation";

/**
 * WS3 remediation R3b, Item 9 (POS workspace/navigation). A NESTED layout
 * (Next.js App Router persists a layout across in-app navigation within
 * its own subtree) so `PosNavigation` mounts once and stays present on
 * every `/operations/pos/*` route, including deep routes reached by a
 * direct URL/deep link (an individual sale, a register session, a
 * receipt, an approval screen) — not just the POS overview page.
 */
export default function PosLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<PosNavigation />
			{children}
		</>
	);
}
