import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.resetModules();
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe("local sign-in code", () => {
  it("creates one private code and rejects incorrect guesses", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "openinstinct-login-"));
    temporaryDirectories.push(directory);
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://user:password@example.com/database"
    );
    vi.stubEnv("LOCAL_DATA_DIR", directory);
    vi.resetModules();

    const { getLocalSignInCode, verifyLocalSignInCode } =
      await import("@db/services/auth/local-code");
    const [first, second] = await Promise.all([
      getLocalSignInCode(),
      getLocalSignInCode(),
    ]);

    expect(first).toMatch(/^\d{12}$/);
    expect(second).toBe(first);
    expect(await readFile(path.join(directory, "sign-in-code"), "utf8")).toBe(
      `${first}\n`
    );
    await expect(verifyLocalSignInCode(first)).resolves.toBe(true);
    await expect(
      verifyLocalSignInCode(
        "000000000000" === first ? "111111111111" : "000000000000"
      )
    ).resolves.toBe(false);
    await expect(verifyLocalSignInCode("000000")).resolves.toBe(false);
  });
});
