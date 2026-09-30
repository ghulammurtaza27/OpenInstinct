import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { env } from "@shared/environment";

const localProvider = createOpenAICompatible({
  name: "ods-local",
  baseURL: env.LOCAL_MODEL_BASE_URL,
  apiKey: env.LOCAL_MODEL_API_KEY,
  includeUsage: true,
});

const localModel = localProvider(env.LOCAL_MODEL_ID);

export const localModelSelection = {
  model: localModel,
  modelContextWindowTokens: env.LOCAL_MODEL_CONTEXT_TOKENS,
  reasoning: "low" as const,
};
