import { Button } from "@meridian/ui/components/button";
import Link from "next/link";

export default function NotFound() {
	return (
		<div className="container mx-auto flex max-w-3xl flex-col items-start gap-4 px-4 py-16">
			<h1 className="font-heading font-semibold text-2xl">Page not found</h1>
			<p className="text-muted-foreground text-sm">
				The page you requested does not exist in this prototype.
			</p>
			<Button render={<Link href="/" />} variant="outline">
				Back to home
			</Button>
		</div>
	);
}
