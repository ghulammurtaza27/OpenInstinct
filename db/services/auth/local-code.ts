import { randomInt, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@shared/environment";

const codePattern = /^\d{12}$/;
let codePromise: Promise<string> | undefined;

export async function getLocalSignInCode() {
  codePromise ??= readOrCreateCode();
  try {
    return await codePromise;
  } catch (error) {
    codePromise = undefined;
    throw error;
  }
}

export async function verifyLocalSignInCode(candidate: string) {
  if (!codePattern.test(candidate)) return false;
  const expected = await getLocalSignInCode();
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}

async function readOrCreateCode() {
  const filename = path.resolve(env.LOCAL_DATA_DIR, "sign-in-code");
  try {
    return validateCode(await readFile(filename, "utf8"));
  } catch (error) {
    if (!isMissingFile(error)) throw error;
  }

  await mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
  const generated = randomInt(0, 1_000_000_000_000)
    .toString()
    .padStart(12, "0");
  try {
    await writeFile(filename, `${generated}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    return generated;
  } catch (error) {
    if (!isExistingFile(error)) throw error;
    return validateCode(await readFile(filename, "utf8"));
  }
}

function validateCode(value: string) {
  const code = value.trim();
  if (!codePattern.test(code)) {
    throw new Error("The local sign-in code file is invalid.");
  }
  return code;
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function isExistingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "EEXIST";
}
