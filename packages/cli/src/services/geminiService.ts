/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config, ToolCallRequestInfo } from '@google/gemini-cli-core';
import type { LoadedSettings } from '../config/settings.js';
import {
  executeToolCall,
  shutdownTelemetry,
  isTelemetrySdkInitialized,
  GeminiEventType,
  OutputFormat,
  JsonFormatter,
  uiTelemetryService,
} from '@google/gemini-cli-core';

import type { Content, Part } from '@google/genai';

import { handleSlashCommand } from '../nonInteractiveCliCommands.js';
import {
  handleError,
  handleToolError,
  handleCancellationError,
  handleMaxTurnsExceededError,
} from '../utils/errors.js';

// Simplified isSlashCommand for backend
function isSlashCommand(input: string): boolean {
  return input.startsWith('/');
}

export class GeminiService {
  constructor(private config: Config, private settings: LoadedSettings) {}

  async *generateContent(input: string, prompt_id: string): AsyncGenerator<string> {
    // ConsolePatcher removed as it's CLI-specific

    // Log config snapshot at processing entry; infer source by sessionId
    try {
      const sessionId = this.config.getSessionId?.() ?? 'unknown';
      const source = sessionId === 'web-server-session' ? 'WEB_UI' : 'CLI';
      const snapshot = {
        source,
        sessionId,
        model: this.config.getModel?.() ?? 'unknown',
        outputFormat: this.config.getOutputFormat?.(),
        targetDir: this.config.getTargetDir?.(),
        workingDir: this.config.getWorkingDir?.(),
        sandboxEnabled:
          typeof this.config.getSandbox === 'function'
            ? !!this.config.getSandbox()
            : undefined,
      };
      // Use a stable, readable log format
      const line = '[GeminiService] Config:' + ' ' + JSON.stringify(snapshot) + '\n';
      if (source === 'CLI') {
        try { process.stderr.write(line); } catch { /* fallback */ console.error(line.trim()); }
      } else {
        // eslint-disable-next-line no-console
        console.log(line.trim());
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[GeminiService] Failed to log config snapshot:', e);
    }

    try {
      const geminiClient = this.config.getGeminiClient();
      const abortController = new AbortController();

      let query: Part[] | undefined;

      if (isSlashCommand(input)) {
        const slashCommandResult = await handleSlashCommand(
          input,
          abortController,
          this.config,
          this.settings,
        );
        if (slashCommandResult) {
          query = slashCommandResult as Part[];
        }
      }

      if (!query) {
        query = [{ text: input }];
      }

      let currentMessages: Content[] = [{ role: 'user', parts: query }];
      // Log final user instruction that will be sent to LLM API
      try {
        const sessionId = this.config.getSessionId?.() ?? 'unknown';
        const source = sessionId === 'web-server-session' ? 'WEB_UI' : 'CLI';
        const parts = currentMessages[0]?.parts || [];
        const textOnly = parts
          .map((p) => (typeof (p as any).text === 'string' ? (p as any).text : undefined))
          .filter((t) => typeof t === 'string');
        const payload = {
          source,
          sessionId,
          prompt_id,
          parts,
          text_preview: textOnly.length ? textOnly.join('\n') : undefined,
        };
        const line = '[GeminiService] FinalUserPrompt:' + ' ' + JSON.stringify(payload) + '\n';
        if (source === 'CLI') {
          try { process.stderr.write(line); } catch { /* fallback */ console.error(line.trim()); }
        } else {
          // eslint-disable-next-line no-console
          console.log(line.trim());
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[GeminiService] Failed to log final user prompt:', e);
      }
      let turnCount = 0;

      while (true) {
        turnCount++;
        if (
          this.config.getMaxSessionTurns() >= 0 &&
          turnCount > this.config.getMaxSessionTurns()
        ) {
          handleMaxTurnsExceededError(this.config);
        }
        const toolCallRequests: ToolCallRequestInfo[] = [];

        const responseStream = geminiClient.sendMessageStream(
          currentMessages[0]?.parts || [],
          abortController.signal,
          prompt_id,
        );

        let responseText = ''; // Keep responseText for JSON output
        for await (const event of responseStream) {
          if (abortController.signal.aborted) {
            handleCancellationError(this.config);
          }

          if (event.type === GeminiEventType.Content) {
            if (this.config.getOutputFormat() === OutputFormat.JSON) {
              responseText += event.value; // Accumulate for JSON output
            } else {
              yield event.value;
            }
          } else if (event.type === GeminiEventType.ToolCallRequest) {
            toolCallRequests.push(event.value);
          }
        }

        if (toolCallRequests.length > 0) {
          const toolResponseParts: Part[] = [];
          for (const requestInfo of toolCallRequests) {
            const toolResponse = await executeToolCall(
              this.config,
              requestInfo,
              abortController.signal,
            );

            if (toolResponse.error) {
              handleToolError(
                requestInfo.name,
                toolResponse.error,
                this.config,
                toolResponse.errorType || 'TOOL_EXECUTION_ERROR',
                typeof toolResponse.resultDisplay === 'string'
                  ? toolResponse.resultDisplay
                  : undefined,
              );
            }

            if (toolResponse.responseParts) {
              toolResponseParts.push(...toolResponse.responseParts);
            }
          }
          currentMessages = [{ role: 'user', parts: toolResponseParts }];
        } else {
          if (this.config.getOutputFormat() === OutputFormat.JSON) {
            const formatter = new JsonFormatter();
            const stats = uiTelemetryService.getMetrics();
            yield formatter.format(responseText, stats); // Yield formatted JSON
          }
          return;
        }
      }
    } catch (error) {
      handleError(error, this.config);
      throw error;
    } finally {
      if (isTelemetrySdkInitialized()) {
        await shutdownTelemetry(this.config);
      }
    }
  }
}
