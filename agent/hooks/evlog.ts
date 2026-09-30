import { defineEvlogHook } from "evlog/eve";

export default defineEvlogHook({
  init: {
    env: { service: "open-instinct-local" },
    redact: true,
  },
  message: "omit",
  redact: true,
  sessionEvent: false,
});
