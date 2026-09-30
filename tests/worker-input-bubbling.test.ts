import type { DynamicResolveContext } from "eve";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import browserAgent from "@agent/subagents/browser-agent/agent";

describe("worker input bubbling", () => {
  it("keeps native questions disabled inside browser workers", () => {
    expect(
      existsSync("agent/subagents/browser-agent/tools/ask_question.ts")
    ).toBe(false);
  });

  it("selects the local model for every browser worker model step", async () => {
    const selection = await browserAgent.model.events["step.started"]?.({}, {
      channel: { kind: "http" },
      messages: [],
      model: null,
      session: {
        auth: { current: null, initiator: null },
        id: "browser-worker-test",
      },
    } satisfies DynamicResolveContext);
    expect(selection).toMatchObject({
      modelContextWindowTokens: 65_536,
      reasoning: "low",
    });
    expect(selection?.model).toMatchObject({
      modelId: "/models/Qwen3.6-35B-A3B-UD-IQ4_NL.gguf",
    });
  });

  it("ends the worker turn and routes the answer through its agent id", () => {
    const instructions = readFileSync(
      "agent/instructions/content/role/interactive.md",
      "utf8"
    );
    const workerInstructions = readFileSync(
      "agent/subagents/browser-agent/instructions.md",
      "utf8"
    );

    expect(instructions).toContain("continue that worker with its `agentId`");
    expect(instructions).toContain(
      "Before surfacing a `Needs user input:` blocker"
    );
    expect(instructions).toContain(
      "confirm the worker explicitly reported checking compatible vault items"
    );
    expect(workerInstructions).toContain(
      "Before returning `Needs user input:` or `Needs vault setup:`"
    );
    expect(workerInstructions).toContain("select the relevant compatible item");
    expect(workerInstructions).toContain(
      "native `final_output` tool exactly once"
    );
    expect(workerInstructions).toContain("End the turn immediately");
  });
});
