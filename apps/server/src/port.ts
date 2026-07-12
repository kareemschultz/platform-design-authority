const VALID_PORT = /^\d+$/;

export function parsePort(value: string | undefined): number {
	const candidate = value ?? "3000";
	if (!VALID_PORT.test(candidate)) {
		throw new Error(
			`PORT must be an integer from 1 to 65535, received: ${candidate}`
		);
	}

	const port = Number(candidate);
	if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
		throw new Error(
			`PORT must be an integer from 1 to 65535, received: ${candidate}`
		);
	}

	return port;
}
