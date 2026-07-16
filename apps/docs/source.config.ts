import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { z } from "zod";

const productDocumentationSchema = pageSchema.extend({
	api_reference_mode: z
		.enum(["boundary-overview", "generated-canonical"])
		.optional(),
	applicable_version: z.string().min(1),
	audience: z
		.array(
			z.enum([
				"administrator",
				"developer",
				"evaluator",
				"integrator",
				"operator",
				"support",
				"user",
			])
		)
		.min(1),
	content_class: z.enum([
		"administrator-guide",
		"api-reference",
		"developer-guide",
		"getting-started",
		"landing",
		"migration-guide",
		"release-note",
		"troubleshooting",
		"user-guide",
	]),
	contract_refs: z.array(z.string()).default([]),
	documentation_id: z.string().regex(/^PDOC-\d{4}$/),
	evidence_revision: z.string().regex(/^[0-9a-f]{40}$/),
	implementation_evidence: z.array(z.string()).min(1),
	last_verified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	openapi_operation_ids: z.array(z.string()).optional(),
	owner: z.string().min(1),
	permission_refs: z.array(z.string()).default([]),
	publication_state: z.enum([
		"internal-prototype",
		"release-preview",
		"published",
		"retired",
	]),
	related_capabilities: z.array(z.string()).default([]),
});

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
	dir: "content/docs",
	docs: {
		postprocess: {
			includeProcessedMarkdown: true,
		},
		schema: productDocumentationSchema,
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
