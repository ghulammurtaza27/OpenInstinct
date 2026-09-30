import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const applicationEnvironment = [
  "BETTER_AUTH_*",
  "BLOB_*",
  "DATABASE_URL",
  "*_CONNECTOR_UID",
  "KERNEL_*",
  "LINQ_*",
  "LOCAL_*",
  "NODE_ENV",
  "SECRET_ENCRYPTION_KEY",
  "VERCEL_*",
];
const runtimeEnvironment = applicationEnvironment;

describe("Turbo configuration", () => {
  it("scopes application environment variables to their owning tasks", async () => {
    const turbo = z
      .object({
        tasks: z.object({
          "build:app": z.object({ env: z.array(z.string()) }),
          "build:vercel": z.object({ env: z.array(z.string()) }),
          "dev:app": z.object({ passThroughEnv: z.array(z.string()) }),
          "start:app": z.object({ passThroughEnv: z.array(z.string()) }),
        }),
      })
      .loose()
      .parse(
        JSON.parse(
          await readFile(new URL("../turbo.json", import.meta.url), "utf8")
        )
      );

    expect(turbo).not.toHaveProperty("globalEnv");
    expect(turbo.tasks["build:app"].env).toEqual(
      expect.arrayContaining([...applicationEnvironment, "EVE_NEXT_*"])
    );
    expect(turbo.tasks["build:app"].env).toHaveLength(
      applicationEnvironment.length + 1
    );
    expect(turbo.tasks["build:vercel"].env).toEqual(applicationEnvironment);
    expect(turbo.tasks["dev:app"].passThroughEnv).toEqual(runtimeEnvironment);
    expect(turbo.tasks["start:app"].passThroughEnv).toEqual(runtimeEnvironment);
  });

  it("documents the private local deployment configuration", async () => {
    const readme = await readFile(
      new URL("../README.md", import.meta.url),
      "utf8"
    );
    expect(readme).toContain("Local ODS `llama-server`");
    expect(readme).toContain("The same local Qwen model");
    expect(readme).toContain("Browser automation is currently disabled");
    expect(readme).toContain("OpenTelemetry export is disabled");
    expect(readme).not.toContain("vercel.com/new/clone");
  });
});
