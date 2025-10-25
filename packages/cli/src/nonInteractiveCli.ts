/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '@google/gemini-cli-core';
import type { LoadedSettings } from './config/settings.js';
import {
  shutdownTelemetry,
  isTelemetrySdkInitialized,
  promptIdContext,
} from '@google/gemini-cli-core';

import { ConsolePatcher } from './ui/utils/ConsolePatcher.js';
import { GeminiService } from './services/geminiService.js';

export async function runNonInteractive(
  config: Config,
  settings: LoadedSettings,
  input: string,
  prompt_id: string,
): Promise<void> {
  return promptIdContext.run(prompt_id, async () => {
    const consolePatcher = new ConsolePatcher({
      stderr: true,
      debugMode: config.getDebugMode(),
    });

  try {
    consolePatcher.patch();
      // Handle EPIPE errors when the output is piped to a command that closes early.
      process.stdout.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EPIPE') {
          // Exit gracefully if the pipe is closed.
          process.exit(0);
        }
      });

      // Log config snapshot and final user prompt on CLI (stderr)
      try {
        const cfgSnapshot = {
          source: 'CLI',
          sessionId: config.getSessionId?.() ?? 'unknown',
          model: config.getModel?.() ?? 'unknown',
          outputFormat: config.getOutputFormat?.(),
          targetDir: config.getTargetDir?.(),
          workingDir: config.getWorkingDir?.(),
          sandboxEnabled:
            typeof config.getSandbox === 'function' ? !!config.getSandbox() : undefined,
        };
        process.stderr.write('[CLI] Config: ' + JSON.stringify(cfgSnapshot) + '\n');
        const payload = {
          source: 'CLI',
          sessionId: config.getSessionId?.() ?? 'unknown',
          prompt_id,
          parts: [{ text: input }],
          text_preview: input,
        };
        process.stderr.write('[CLI] FinalUserPrompt: ' + JSON.stringify(payload) + '\n');
      } catch (_) {}

      const geminiService = new GeminiService(config, settings);
      for await (const chunk of geminiService.generateContent(input, prompt_id)) {
        process.stdout.write(chunk);
      }
      process.stdout.write('\n'); // Ensure a final newline
    } catch (error) {
      // Error handling is now inside GeminiService, but we might need a top-level catch for unhandled errors
      console.error('An unexpected error occurred:', error);
      process.exit(1);
    } finally {
      consolePatcher.cleanup();
      if (isTelemetrySdkInitialized()) {
        await shutdownTelemetry(config);
      }
    }
  });
}
