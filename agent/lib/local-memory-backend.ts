import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  MemoryDocumentConflictError,
  type MemoryDocumentBackend,
} from "eve/memory/file";

const lockTails = new Map<string, Promise<void>>();
const noop = () => undefined;

export function localMemoryBackend(
  dataDirectory: string
): MemoryDocumentBackend {
  const memoryDirectory = path.resolve(dataDirectory, "memory");

  return {
    async read({ key }) {
      return readDocument(memoryDirectory, key);
    },
    async write({ key, content, expectedVersion }) {
      return withKeyLock(key, async () => {
        const current = await readDocument(memoryDirectory, key);
        if (current?.version !== expectedVersion) {
          throw new MemoryDocumentConflictError(key);
        }

        await mkdir(memoryDirectory, { recursive: true, mode: 0o700 });
        const target = documentPath(memoryDirectory, key);
        const temporary = `${target}.${randomUUID()}.tmp`;
        await writeFile(temporary, content, { encoding: "utf8", mode: 0o600 });
        try {
          await rename(temporary, target);
        } catch (error) {
          await unlink(temporary).catch(() => undefined);
          throw error;
        }
        return { content, version: versionFor(content) };
      });
    },
  };
}

async function readDocument(directory: string, key: string) {
  try {
    const content = await readFile(documentPath(directory, key), "utf8");
    return { content, version: versionFor(content) };
  } catch (error) {
    if (isMissingFile(error)) return null;
    throw error;
  }
}

function documentPath(directory: string, key: string) {
  const name = createHash("sha256").update(key).digest("hex");
  return path.join(directory, `${name}.md`);
}

function versionFor(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function withKeyLock<T>(key: string, operation: () => Promise<T>) {
  const previous = lockTails.get(key) ?? Promise.resolve();
  let release: () => void = noop;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = previous.then(() => current);
  lockTails.set(key, tail);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (lockTails.get(key) === tail) lockTails.delete(key);
  }
}
