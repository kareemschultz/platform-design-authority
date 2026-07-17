import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const CONTENT_ROOT = fileURLToPath(
	new URL("../content/docs/", import.meta.url)
);
const DOCUMENTATION_ID_PATTERN = /^PDA-DOC-\d{3}$/u;

async function markdownFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map((entry) => {
			const path = join(directory, entry.name);
			if (entry.isDirectory()) {
				return markdownFiles(path);
			}
			return extname(entry.name) === ".mdx" ? [path] : [];
		})
	);
	return nested.flat();
}

const files = await markdownFiles(CONTENT_ROOT);
const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));
const seen = new Map();
for (const [index, file] of files.entries()) {
	const source = sources[index];
	const match = /^documentationId:\s*(\S+)\s*$/mu.exec(source);
	if (!match) {
		continue;
	}
	const [, id] = match;
	const displayPath = relative(CONTENT_ROOT, file);
	if (!DOCUMENTATION_ID_PATTERN.test(id)) {
		throw new Error(`${displayPath}: invalid stable documentation ID ${id}`);
	}
	const prior = seen.get(id);
	if (prior) {
		throw new Error(`${id} is duplicated by ${prior} and ${displayPath}`);
	}
	seen.set(id, displayPath);
}

process.stdout.write(
	`product documentation validation passed: ${seen.size} stable ID${seen.size === 1 ? "" : "s"}\n`
);
