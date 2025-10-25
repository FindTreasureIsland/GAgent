/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentDefinition } from './types.js';
import { DEFAULT_GEMINI_MODEL } from '../config/models.js';
import { LSTool } from '../tools/ls.js';
import { ReadFileTool } from '../tools/read-file.js';
import { GrepTool } from '../tools/grep.js';
import { RipGrepTool } from '../tools/ripGrep.js';
import { GlobTool } from '../tools/glob.js';
import { ReadManyFilesTool } from '../tools/read-many-files.js';
import { MemoryTool } from '../tools/memoryTool.js';
import { WebSearchTool } from '../tools/web-search.js';

/**
 * A task execution agent that plans concrete implementation steps and proposes changes.
 */
export const TaskExecutorAgent: AgentDefinition = {
  name: 'task_executor',
  displayName: 'Task Executor Agent',
  description:
    'Plans and executes development tasks non-interactively: explores the repo, proposes changes, and outlines validation steps.',

  inputConfig: {
    inputs: {
      task_description: {
        description: 'High-level description of the task to implement or execute.',
        type: 'string',
        required: true,
      },
    },
  },

  outputConfig: {
    description:
      'A structured markdown report including Goals, Context, Target Files, Step-by-step Plan, Proposed Changes (with code blocks or diffs), and Validation steps.',
    completion_criteria: [
      'Clearly restate the task goals based on `task_description`.',
      'List relevant files with absolute paths and brief reasons.',
      'Provide a concrete step-by-step plan to implement the task.',
      'Include proposed code changes as diffs or code blocks.',
      'Describe validation steps: tests, manual checks, and risks.',
    ],
  },

  modelConfig: {
    model: DEFAULT_GEMINI_MODEL,
    temp: 0.4,
    top_p: 0.9,
  },

  runConfig: {
    max_time_minutes: 12,
    max_turns: 30,
  },

  // Safe tools only; validated by AgentExecutor.
  toolConfig: {
    tools: [
      LSTool.Name,
      ReadFileTool.Name,
      GrepTool.Name,
      RipGrepTool.Name,
      GlobTool.Name,
      ReadManyFilesTool.Name,
      MemoryTool.Name,
      WebSearchTool.Name,
    ],
  },

  promptConfig: {
    systemPrompt: `You are a senior full-stack engineer tasked with planning and executing a development task in a non-interactive setting.

Input Task: \`${'${task_description}'}\`

Your goals:
1. Understand the current repository structure and locate relevant files.
2. Produce a practical, minimal-change implementation plan.
3. Propose concrete code changes with file paths and snippets or unified diffs.
4. Identify validation steps (tests and manual).

Constraints & Guidance:
- Use only the available non-interactive tools to gather context (list files, glob, grep, read files, etc.).
- Prefer minimal invasive changes that align with the existing style.
- When proposing changes, reference absolute paths from the Environment Context.
- If multiple approaches exist, briefly compare and pick one.
- Do not ask for user input; make reasonable assumptions and proceed.
`,
  },
};