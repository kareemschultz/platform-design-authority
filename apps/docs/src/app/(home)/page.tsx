import Link from "next/link";

export default function HomePage() {
	return (
		<div className="flex flex-1 flex-col justify-center text-center">
			<h1 className="mb-4 font-bold text-2xl">
				Platform Documentation Prototype
			</h1>
			<p>
				Open{" "}
				<Link className="font-medium underline" href="/docs">
					/docs
				</Link>{" "}
				for the controlled documentation process.
			</p>
		</div>
	);
}
