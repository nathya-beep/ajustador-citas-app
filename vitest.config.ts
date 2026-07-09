import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    // Integration test files (tests/api/*) share a single Postgres test database and
    // reset shared tables (Appointment/Lead/Adjuster) in their beforeEach hooks. Running
    // test files in parallel lets one file's beforeEach wipe rows another file's test is
    // mid-assertion on, causing cross-file flakiness. Force sequential file execution.
    fileParallelism: false,
  },
});
