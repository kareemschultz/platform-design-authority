import { Loader2 } from "lucide-react";

export default function Loader() {
	return (
		<div
			aria-label="Loading page"
			className="flex h-full items-center justify-center pt-8"
			role="status"
		>
			<Loader2 aria-hidden="true" className="animate-spin" />
		</div>
	);
}
