export const controlledPrototypeContentScanner = {
	scan(input: { content: string; fileName: string }) {
		// Controlled-prototype scanner seam. Production remains blocked on a qualified scanner/provider.
		return Promise.resolve(
			input.content.includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE")
				? ("Blocked" as const)
				: ("Clean" as const)
		);
	},
};
