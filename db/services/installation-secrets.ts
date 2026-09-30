import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  betterAuthSecretSchema,
  env,
  secretEncryptionKeySchema,
} from "@shared/environment";

const installationSecretsSchema = z.object({
  betterAuthSecret: betterAuthSecretSchema,
  secretEncryptionKey: secretEncryptionKeySchema,
  version: z.literal(1),
});

type InstallationSecrets = z.infer<typeof installationSecretsSchema>;

let installationSecretsPromise: Promise<InstallationSecrets> | undefined;

export async function getInstallationSecrets() {
  installationSecretsPromise ??= resolveInstallationSecrets();
  try {
    return await installationSecretsPromise;
  } catch (error) {
    installationSecretsPromise = undefined;
    throw error;
  }
}

async function resolveInstallationSecrets() {
  const configured = configuredInstallationSecrets();
  if (configured) return configured;

  const filename = path.resolve(
    env.LOCAL_DATA_DIR,
    "installation-secrets.v1.json"
  );
  const existing = await readInstallationSecrets(filename);
  if (existing) return existing;

  const generated = installationSecretsSchema.parse({
    betterAuthSecret: randomBytes(32).toString("base64"),
    secretEncryptionKey: randomBytes(32).toString("base64"),
    version: 1,
  });
  await mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
  try {
    await writeFile(filename, JSON.stringify(generated), {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    return generated;
  } catch (error) {
    if (!isExistingFile(error)) throw error;
    const winner = await readInstallationSecrets(filename);
    if (winner) return winner;
    throw error;
  }
}

function configuredInstallationSecrets() {
  const betterAuthSecret = env.BETTER_AUTH_SECRET;
  const secretEncryptionKey = env.SECRET_ENCRYPTION_KEY;
  if (!betterAuthSecret && !secretEncryptionKey) return undefined;
  if (!betterAuthSecret || !secretEncryptionKey) {
    throw new Error(
      "Set both BETTER_AUTH_SECRET and SECRET_ENCRYPTION_KEY, or leave both unset for automatic local provisioning."
    );
  }
  return installationSecretsSchema.parse({
    betterAuthSecret,
    secretEncryptionKey,
    version: 1,
  });
}

async function readInstallationSecrets(filename: string) {
  try {
    const value: unknown = JSON.parse(await readFile(filename, "utf8"));
    return installationSecretsSchema.parse(value);
  } catch (error) {
    if (isMissingFile(error)) return undefined;
    throw error;
  }
}

function isExistingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "EEXIST";
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
