import { vi } from "vitest";

// "server-only" throws on import outside a react-server bundler context —
// tests run in plain Node, so stub it out rather than every test file
// needing to know about this.
vi.mock("server-only", () => ({}));
