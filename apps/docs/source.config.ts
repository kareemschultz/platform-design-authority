import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { z } from "zod";

const productPageSchema = pageSchema.extend({
	documentationId: z
		.string()
		.regex(/^PDA-DOC-\d{3}$/u, "Use a stable PDA-DOC-NNN identifier")
		.optional(),
});

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
	dir: "content/docs",
	docs: {
		postprocess: {
			includeProcessedMarkdown: true,
		},
		schema: productPageSchema,
	},
	meta: {
		schema: metaSchema,
	},
});

export default defineConfig({
	mdxOptions: {
		// MDX options
	},
});
