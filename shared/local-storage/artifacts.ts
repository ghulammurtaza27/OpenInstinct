import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@shared/environment";

function artifactFilename(storagePathname: string) {
  const name = createHash("sha256").update(storagePathname).digest("hex");
  return path.resolve(env.LOCAL_DATA_DIR, "artifacts", name);
}

export async function writeLocalArtifact(
  storagePathname: string,
  bytes: Uint8Array
) {
  const filename = artifactFilename(storagePathname);
  await mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
  const temporary = `${filename}.${randomUUID()}.tmp`;
  await writeFile(temporary, bytes, { flag: "wx", mode: 0o600 });
  try {
    await rename(temporary, filename);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

export function readLocalArtifact(storagePathname: string) {
  return readFile(artifactFilename(storagePathname));
}

export async function deleteLocalArtifact(storagePathname: string) {
  try {
    await unlink(artifactFilename(storagePathname));
  } catch (error) {
    if (!isMissingFile(error)) throw error;
  }
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
