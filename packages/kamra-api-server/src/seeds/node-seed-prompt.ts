import { emitKeypressEvents } from "node:readline";
import { createInterface } from "node:readline/promises";
import type { Readable, Writable } from "node:stream";

import type { SeedPrompt } from "./seed-runner.js";

export class NodeSeedPrompt implements SeedPrompt {
  constructor(
    private readonly input: Readable = process.stdin,
    private readonly output: Writable = process.stdout
  ) {}

  async confirm(question: string, defaultValue: boolean): Promise<boolean> {
    const suffix = defaultValue ? " [Y/n] " : " [y/N] ";
    const answer = (await this.ask(`${question}${suffix}`)).trim().toLowerCase();

    if (!answer) {
      return defaultValue;
    }

    return answer === "y" || answer === "yes";
  }

  async text(question: string): Promise<string> {
    return (await this.ask(`${question}: `)).trim();
  }

  async secret(question: string): Promise<string> {
    if (!this.isRawModeCapable()) {
      return await this.ask(`${question}: `);
    }

    return await this.askHidden(`${question}: `);
  }

  private async ask(question: string): Promise<string> {
    const readline = createInterface({
      input: this.input,
      output: this.output
    });

    try {
      return await readline.question(question);
    } finally {
      readline.close();
    }
  }

  private askHidden(question: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const input = this.input as NodeJS.ReadStream;
      let value = "";

      const cleanup = () => {
        input.setRawMode(false);
        input.off("keypress", onKeypress);
      };

      emitKeypressEvents(input);
      input.setRawMode(true);
      this.output.write(question);

      const onKeypress = (character: string, key: { name?: string }) => {
        if (key.name === "return") {
          cleanup();
          this.output.write("\n");
          resolve(value);
          return;
        }

        if (key.name === "backspace") {
          value = value.slice(0, -1);
          return;
        }

        if (key.name === "c" && character === "\u0003") {
          cleanup();
          reject(new Error("Seed input cancelled."));
          return;
        }

        value += character;
      };

      input.on("keypress", onKeypress);
      input.resume();
    });
  }

  private isRawModeCapable(): boolean {
    const input = this.input as Partial<NodeJS.ReadStream>;
    return typeof input.setRawMode === "function" && Boolean(input.isTTY);
  }
}
