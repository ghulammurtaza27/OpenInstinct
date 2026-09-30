import { defineMemory } from "eve/memory";
import { fileMemory } from "eve/memory/file";
import {
  preserveProfileMemoryCancellation,
  resolveProfileMemoryScope,
} from "../lib/profile-memory";
import { env } from "@shared/environment";
import { localMemoryBackend } from "@agent/lib/local-memory-backend";

const provider = preserveProfileMemoryCancellation(
  fileMemory({ backend: localMemoryBackend(env.LOCAL_DATA_DIR) })
);

export default defineMemory({
  description: "Remember stable facts and preferences about the current user.",
  provider,
  scope: resolveProfileMemoryScope,
});
