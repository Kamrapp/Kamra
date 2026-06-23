export interface SeedPrompt {
  confirm(question: string, defaultValue: boolean): Promise<boolean>;
  secret(question: string): Promise<string>;
  text(question: string): Promise<string>;
}

export interface SeedExecutionContext {
  env: NodeJS.ProcessEnv;
  prompt: SeedPrompt;
}

export interface SeedRunResult {
  details?: unknown;
  outcome: "completed" | "skipped";
  seedName: string;
}

export interface SeedDefinition {
  configured(env: NodeJS.ProcessEnv): boolean;
  label: string;
  name: string;
  optional: boolean;
  run(context: SeedExecutionContext): Promise<SeedRunResult>;
}

export async function runRegisteredSeeds(
  seeds: SeedDefinition[],
  context: SeedExecutionContext
): Promise<SeedRunResult[]> {
  const results: SeedRunResult[] = [];

  for (const seed of seeds) {
    if (!seed.configured(context.env) && seed.optional) {
      const shouldRun = await context.prompt.confirm(`Seed ${seed.label}?`, false);

      if (!shouldRun) {
        results.push({
          outcome: "skipped",
          seedName: seed.name
        });
        continue;
      }
    }

    results.push(await seed.run(context));
  }

  return results;
}
