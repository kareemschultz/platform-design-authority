import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import Loader from "./loader";

describe("Loader accessible status semantics (fifth-audit F-H-002, second-review closure)", () => {
	test("exposes a status role with an accessible name and hides the decorative icon", () => {
		const markup = renderToStaticMarkup(<Loader />);

		expect(markup).toContain('role="status"');
		expect(markup).toContain('aria-label="Loading page"');
		expect(markup).toContain('aria-hidden="true"');
	});
});
