import { defineAgent, defineDynamic } from "eve";
import { localModelSelection } from "@agent/lib/local-model";

export default defineAgent({
  build: {
    externalDependencies: ["@onkernel/browser-loop"],
  },
  tool: false,
  description:
    "Execute one bounded browser assignment for the root coordinator, including secure vault autofill, transaction preparation, optional durable browser images, human-takeover handoff, cleanup, and a concise verified result.",
  model: defineDynamic({
    events: {
      "step.started": () => localModelSelection,
    },
  }),
  reasoning: "low",
  compaction: {
    thresholdPercent: 0.7,
  },
});
