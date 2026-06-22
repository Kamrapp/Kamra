import { describe, expect, it, vi } from "vitest";

import { runRegisteredSeeds, type SeedDefinition, type SeedPrompt } from "./seed-runner.js";

function createPrompt(confirmResult: boolean): SeedPrompt {
  return {
    confirm: vi.fn().mockResolvedValue(confirmResult),
    secret: vi.fn(),
    text: vi.fn()
  };
}

function createOptionalSeed(configured: boolean): SeedDefinition {
  return {
    configured: () => configured,
    label: "optional thing",
    name: "optional_thing",
    optional: true,
    run: vi.fn().mockResolvedValue({
      outcome: "completed",
      seedName: "optional_thing"
    })
  };
}

describe("runRegisteredSeeds", () => {
  it("runs configured optional seeds without asking", async () => {
    const seed = createOptionalSeed(true);
    const prompt = createPrompt(false);

    const results = await runRegisteredSeeds([seed], {
      env: {},
      prompt
    });

    expect(prompt.confirm).not.toHaveBeenCalled();
    expect(seed.run).toHaveBeenCalled();
    expect(results).toEqual([
      {
        outcome: "completed",
        seedName: "optional_thing"
      }
    ]);
  });

  it("skips unconfigured optional seeds when the user declines", async () => {
    const seed = createOptionalSeed(false);
    const prompt = createPrompt(false);

    const results = await runRegisteredSeeds([seed], {
      env: {},
      prompt
    });

    expect(prompt.confirm).toHaveBeenCalledWith("Seed optional thing?", false);
    expect(seed.run).not.toHaveBeenCalled();
    expect(results).toEqual([
      {
        outcome: "skipped",
        seedName: "optional_thing"
      }
    ]);
  });
});
