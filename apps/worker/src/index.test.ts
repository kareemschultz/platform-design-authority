import { describe, expect, it } from "bun:test";

import { workerProcessOwner } from "./index";

describe("worker package boundary", () => {
	it("identifies the Event Backbone as process owner", () => {
		expect(workerProcessOwner).toBe("platform.events");
	});
});
