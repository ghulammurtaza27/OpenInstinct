import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dataDirectory: string;

beforeEach(async () => {
  vi.resetModules();
  dataDirectory = await mkdtemp(path.join(tmpdir(), "openinstinct-secrets-"));
  vi.stubEnv("BETTER_AUTH_SECRET", "");
  vi.stubEnv("DATABASE_URL", "postgresql://user:password@example.com/database");
  vi.stubEnv("KERNEL_API_KEY", "test-kernel-key");
  vi.stubEnv("LOCAL_DATA_DIR", dataDirectory);
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("SECRET_ENCRYPTION_KEY", "");
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(dataDirectory, { force: true, recursive: true });
});

describe("installation secrets", () => {
  it("atomically creates, persists, and caches independent local secrets", async () => {
    const getInstallationSecrets = await loadInstallationSecrets();
    const [first, second] = await Promise.all([
      getInstallationSecrets(),
      getInstallationSecrets(),
    ]);

    expect(first).toEqual(second);
    expect(first.betterAuthSecret).not.toBe(first.secretEncryptionKey);
    expect(Buffer.from(first.betterAuthSecret, "base64")).toHaveLength(32);
    expect(Buffer.from(first.secretEncryptionKey, "base64")).toHaveLength(32);
    const serialized = await readFile(
      path.join(dataDirectory, "installation-secrets.v1.json"),
      "utf8"
    );
    const stored: unknown = JSON.parse(serialized);
    expect(stored).toEqual(first);
  });

  it("loads the same secrets after a fresh module instance", async () => {
    const first = await (await loadInstallationSecrets())();
    vi.resetModules();
    const second = await (await loadInstallationSecrets())();
    expect(second).toEqual(first);
  });

  it("preserves explicit overrides without creating a local file", async () => {
    const configured = {
      betterAuthSecret: Buffer.alloc(32, 4).toString("base64"),
      secretEncryptionKey: Buffer.alloc(32, 5).toString("base64"),
      version: 1 as const,
    };
    vi.stubEnv("BETTER_AUTH_SECRET", configured.betterAuthSecret);
    vi.stubEnv("SECRET_ENCRYPTION_KEY", configured.secretEncryptionKey);

    await expect((await loadInstallationSecrets())()).resolves.toEqual(
      configured
    );
    await expect(
      readFile(path.join(dataDirectory, "installation-secrets.v1.json"))
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects a partial explicit override", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", Buffer.alloc(32, 6).toString("base64"));
    await expect((await loadInstallationSecrets())()).rejects.toThrow(
      "Set both BETTER_AUTH_SECRET and SECRET_ENCRYPTION_KEY"
    );
  });

  it("rejects malformed local installation-secret storage", async () => {
    await writeFile(
      path.join(dataDirectory, "installation-secrets.v1.json"),
      JSON.stringify({ version: 1 })
    );
    await expect((await loadInstallationSecrets())()).rejects.toThrow(
      "Invalid input: expected string"
    );
  });
});

async function loadInstallationSecrets() {
  const secretsModule = await import("@db/services/installation-secrets");
  return secretsModule.getInstallationSecrets;
}
