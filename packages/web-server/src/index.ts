import express from 'express';
import cors from 'cors';
import { loadSettings, GeminiService } from '@google/gemini-cli';
import {
  Config,
  OutputFormat,
  AuthType,
  DEFAULT_GEMINI_FLASH_MODEL,
  GeminiClient,
  Turn,
  AgentRegistry,
  AgentExecutor,
  type SubagentActivityEvent,
} from '@google/gemini-cli-core';
import net from 'net';

const app = express();
const preferredPort = Number(process.env['PORT'] ?? 3000);

app.use(express.json());
app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));

// Health check
app.get('/', (_req, res) => {
  res.send('Gemini Web Server is running!');
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Favicon to avoid browser 404 noise
app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

// Simple chat UI page
app.get('/ui', (_req, res) => {
  const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Gemini Chat</title>
      <style>
        :root { color-scheme: light dark; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", Arial, sans-serif; margin: 0; background: #0b0b0b; color: #eaeaea; }
        .container { max-width: 900px; margin: 0 auto; padding: 24px; }
        h1 { font-size: 20px; margin: 0 0 16px; }
        .chat { border: 1px solid #222; border-radius: 12px; padding: 16px; background: #121212; }
        .messages { height: 50vh; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 12px; }
        .thought-banner { position: sticky; top: 0; z-index: 1; padding: 6px 8px; border-radius: 8px; background: #181818; border: 1px solid #2a2a2a; font-size: 12px; color: #bbb; }
        .msg { padding: 10px 12px; border-radius: 10px; line-height: 1.5; white-space: pre-wrap; }
        .user { align-self: flex-end; background: #1f3b7f; }
        .assistant { align-self: flex-start; background: #1a1a1a; border: 1px solid #2a2a2a; }
        .input { display: flex; gap: 8px; margin-top: 12px; }
        textarea { flex: 1; resize: vertical; min-height: 60px; max-height: 220px; padding: 10px; border-radius: 8px; border: 1px solid #333; background: #0f0f0f; color: #eaeaea; }
      button { padding: 10px 16px; border-radius: 8px; border: 1px solid #333; background: #1f1f1f; color: #eaeaea; cursor: pointer; }
      button:hover { background: #2a2a2a; }
      .status { font-size: 12px; color: #aaa; margin-top: 6px; }
      /* 操作步骤样式 */
      .ops { margin-top: 12px; border: 1px solid #222; border-radius: 12px; padding: 12px; background: #121212; }
      .ops h3 { margin: 0 0 8px; font-size: 14px; color: #ccc; }
      .steps { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
      .step { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; }
      .step .dot { width: 10px; height: 10px; border-radius: 50%; background: #555; flex: 0 0 10px; }
      .step.active { background: #181818; }
      .step.active .dot { background: #3b82f6; }
      .step.done .dot { background: #22c55e; }
      .step.error .dot { background: #ef4444; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Gemini Chat</h1>
      <div class="chat">
        <div id="messages" class="messages" aria-live="polite" aria-busy="false"></div>
        <div class="input">
          <textarea id="prompt" placeholder="Type your question, Shift+Enter for newline, Enter to send"></textarea>
          <select id="agent" title="Select Agent">
            <option value="codebase_investigator">Codebase Investigator</option>
            <option value="task_executor">Task Executor</option>
          </select>
          <button id="send">Send</button>
          <button id="runAgent">Run Agent</button>
        </div>
        <div id="status" class="status"></div>
      </div>
      <div class="ops" aria-label="Action Steps">
        <h3>Action Steps</h3>
        <ul class="steps" id="steps"></ul>
      </div>
    </div>
    <script>
      const messagesEl = document.getElementById('messages');
      const promptEl = document.getElementById('prompt');
      const agentSel = document.getElementById('agent');
      const sendBtn = document.getElementById('send');
      const runAgentBtn = document.getElementById('runAgent');
      const statusEl = document.getElementById('status');
      const stepsEl = document.getElementById('steps');
      let thoughtBannerEl = null;

      const STEP_LABELS = ['Prepare Request', 'Establish Connection', 'Receive Data', 'Done'];
      const stepItems = [];
      function initSteps() {
        stepsEl.innerHTML = '';
        stepItems.length = 0;
        STEP_LABELS.forEach((label, i) => {
          const li = document.createElement('li');
          li.className = 'step' + (i === 0 ? ' active' : '');
          li.innerHTML = '<span class="dot"></span><span class="label">' + label + '</span>';
          stepsEl.appendChild(li);
          stepItems.push(li);
        });
      }
      function setStepActive(index) {
        stepItems.forEach((el, i) => {
          el.classList.remove('active');
          if (i === index) el.classList.add('active');
        });
      }
      function setStepDone(index) {
        if (stepItems[index]) {
          stepItems[index].classList.remove('active');
          stepItems[index].classList.add('done');
        }
      }
      function setStepError(index) {
        if (stepItems[index]) {
          stepItems[index].classList.remove('active');
          stepItems[index].classList.add('error');
        }
      }

      function addMessage(role, text) {
        const el = document.createElement('div');
        el.className = 'msg ' + (role === 'user' ? 'user' : 'assistant');
        el.textContent = text || '';
        messagesEl.appendChild(el);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return el;
      }

      function ensureThoughtBanner() {
        if (!thoughtBannerEl) {
          thoughtBannerEl = document.createElement('div');
          thoughtBannerEl.className = 'thought-banner';
          thoughtBannerEl.textContent = '';
          messagesEl.insertAdjacentElement('afterbegin', thoughtBannerEl);
        } else {
          thoughtBannerEl.textContent = '';
        }
      }

      async function streamChat(prompt) {
        initSteps();
        setStepActive(0);
        statusEl.textContent = 'Generating...';
        statusEl.setAttribute('aria-busy', 'true');
        ensureThoughtBanner();
        const assistantEl = addMessage('assistant', '');
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
          });
          if (!res.ok || !res.body) {
            throw new Error('Streaming connection unavailable');
          }
          setStepDone(0);
          setStepActive(1);
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let firstChunk = true;
          const DELIM = String.fromCharCode(10, 10); // \n\n
          const DELIM_CRLF = String.fromCharCode(13, 10, 13, 10); // \r\n\r\n
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            // SSE 格式：按空行分割，每段以 data: 开头
            let idx;
            while ((idx = buffer.indexOf(DELIM)) >= 0 || (idx = buffer.indexOf(DELIM_CRLF)) >= 0) {
              const usedDelim = buffer.indexOf(DELIM) >= 0 ? DELIM : DELIM_CRLF;
              const chunk = buffer.slice(0, idx).trim();
              buffer = buffer.slice(idx + usedDelim.length);
              if (!chunk.startsWith('data:')) continue;
              const payload = chunk.slice(5).trim();
              try {
                const evt = JSON.parse(payload);
                if (evt.type === 'content') {
                  if (firstChunk) { setStepDone(1); setStepActive(2); firstChunk = false; }
                  assistantEl.textContent += evt.value;
                  messagesEl.scrollTop = messagesEl.scrollHeight;
                } else if (evt.type === 'thought') {
                  // 展示“思考主题/短句”在消息区顶部（思考横幅）
                  const subject = (evt.value && evt.value.subject) ? evt.value.subject : '';
                  const description = (evt.value && evt.value.description) ? evt.value.description : '';
                  const summary = subject || description || '';
                  if (summary) {
                    ensureThoughtBanner();
                    thoughtBannerEl.textContent = 'Thought: ' + String(summary).slice(0, 120);
                  }
                } else if (evt.type === 'steps') {
                  // 渲染“完成步骤”列表（来自后端模型总结）
                  try {
                    const vp = evt.value;
                    const list = Array.isArray(vp?.steps) ? vp.steps : [];
                    if (list.length) {
                      stepsEl.innerHTML = '';
                      list.forEach((s) => {
                        const li = document.createElement('li');
                        li.className = 'step done';
                        li.innerHTML = '<span class="dot"></span><span class="label">' + String(s) + '</span>';
                        stepsEl.appendChild(li);
                      });
                    } else if (vp?.stepsRaw) {
                      stepsEl.innerHTML = '';
                      const li = document.createElement('li');
                      li.className = 'step done';
                      li.innerHTML = '<span class="dot"></span><span class="label">' + String(vp.stepsRaw).slice(0, 500) + '</span>';
                      stepsEl.appendChild(li);
                    }
                  } catch (_) {}
                } else if (evt.type === 'end') {
                  setStepDone(2);
                  setStepDone(3);
                  statusEl.textContent = 'Done';
                  statusEl.setAttribute('aria-busy', 'false');
                } else if (evt.type === 'error') {
                  setStepError(1);
                  statusEl.textContent = 'Error: ' + (evt.value || 'Unknown error');
                  statusEl.setAttribute('aria-busy', 'false');
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        } catch (err) {
          // 流式失败时，回退到一次性 JSON 接口
          try {
            const resp = await fetch('/api/chat-json', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt })
            });
            if (!resp.ok) throw new Error('JSON endpoint unavailable');
            setStepDone(0);
            setStepDone(1);
            const data = await resp.json();
            setStepActive(2);
            assistantEl.textContent = (data && data.response) ? data.response : '(No response content)';
            setStepDone(2);
            setStepDone(3);
            statusEl.textContent = 'Done';
            statusEl.setAttribute('aria-busy', 'false');
          } catch (e2) {
            setStepError(0);
            statusEl.textContent = 'Request failed: ' + ((e2 && e2.message) || (err && err.message) || 'Unknown error');
            statusEl.setAttribute('aria-busy', 'false');
          }
        }
      }

      async function streamAgent(prompt, agentName) {
        initSteps();
        setStepActive(0);
        statusEl.textContent = 'Agent running...';
        statusEl.setAttribute('aria-busy', 'true');
        ensureThoughtBanner();
        const assistantEl = addMessage('assistant', '');
        try {
          const selectedAgent = agentName || (agentSel && agentSel.value) || 'codebase_investigator';
          const inputs = selectedAgent === 'task_executor'
            ? { task_description: prompt }
            : { investigation_focus: prompt };
          const res = await fetch('/api/agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agent: selectedAgent,
              inputs,
              // 提高运行限制，减少过早终止概率
              runConfig: { max_time_minutes: 15, max_turns: 30 }
            })
          });
          if (!res.ok || !res.body) {
            throw new Error('流式连接不可用');
          }
          setStepDone(0);
          setStepActive(1);
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let firstChunk = true;
          const DELIM = String.fromCharCode(10, 10); // \n\n
          const DELIM_CRLF = String.fromCharCode(13, 10, 13, 10); // \r\n\r\n
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let idx;
            while ((idx = buffer.indexOf(DELIM)) >= 0 || (idx = buffer.indexOf(DELIM_CRLF)) >= 0) {
              const usedDelim = buffer.indexOf(DELIM) >= 0 ? DELIM : DELIM_CRLF;
              const chunk = buffer.slice(0, idx).trim();
              buffer = buffer.slice(idx + usedDelim.length);
              if (!chunk.startsWith('data:')) continue;
              const payload = chunk.slice(5).trim();
              try {
                const evt = JSON.parse(payload);
                if (evt.type === 'content') {
                  if (firstChunk) { setStepDone(1); setStepActive(2); firstChunk = false; }
                  assistantEl.textContent += evt.value;
                  messagesEl.scrollTop = messagesEl.scrollHeight;
                } else if (evt.type === 'thought') {
                  const subject = (evt.value && evt.value.subject) ? evt.value.subject : '';
                  const description = (evt.value && evt.value.description) ? evt.value.description : '';
                  const summary = subject || description || '';
                  if (summary) {
                    ensureThoughtBanner();
                    thoughtBannerEl.textContent = 'Thought: ' + String(summary).slice(0, 120);
                  }
                } else if (evt.type === 'end') {
                  setStepDone(2);
                  setStepDone(3);
                  const reason = (evt && evt.value && evt.value.terminate_reason) ? evt.value.terminate_reason : '';
                  statusEl.textContent = reason ? ('Done (Reason: ' + reason + ')') : 'Done';
                  statusEl.setAttribute('aria-busy', 'false');
                } else if (evt.type === 'error') {
                  setStepError(1);
                  statusEl.textContent = 'Error: ' + (evt.value || 'Unknown error');
                  statusEl.setAttribute('aria-busy', 'false');
                }
              } catch (_) {}
            }
          }
        } catch (err) {
          setStepError(0);
          statusEl.textContent = 'Request failed: ' + ((err && err.message) || 'Unknown error');
          statusEl.setAttribute('aria-busy', 'false');
        }
      }

      function submit() {
        const prompt = promptEl.value.trim();
        if (!prompt) return;
        addMessage('user', prompt);
        promptEl.value = '';
        streamChat(prompt);
      }

      sendBtn.addEventListener('click', submit);
      runAgentBtn.addEventListener('click', () => {
        const prompt = promptEl.value.trim();
        if (!prompt) return;
        const agentName = (agentSel && agentSel.value) || 'codebase_investigator';
        addMessage('user', '[智能体: ' + agentName + '] ' + prompt);
        promptEl.value = '';
        streamAgent(prompt, agentName);
      });
      promptEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submit();
        }
      });
    </script>
  </body>
  </html>`;
  res.type('html').send(html);
});

// Build a fresh Config for each request (allows per-endpoint output format)
async function buildConfig(outputFormat: OutputFormat) {
  const settings = loadSettings();
  const requestedModel =
    process.env['GEMINI_MODEL'] ??
    ((settings.merged.model?.name as string | undefined) ?? DEFAULT_GEMINI_FLASH_MODEL);
  const config = new Config({
    sessionId: 'web-server-session',
    targetDir: process.cwd(),
    debugMode: false,
    cwd: process.cwd(),
    model: requestedModel,
    question: '',
    interactive: false,
    output: { format: outputFormat },
  });
  await config.initialize();
  // Initialize authentication (non-interactive): prefer env vars, fallback to settings
  const enforced = settings.merged.security?.auth?.enforcedType as AuthType | undefined;
  const selected = settings.merged.security?.auth?.selectedType as AuthType | undefined;
  const envAuth: AuthType | undefined =
    process.env['GOOGLE_GENAI_USE_GCA'] === 'true'
      ? AuthType.LOGIN_WITH_GOOGLE
      : process.env['GOOGLE_GENAI_USE_VERTEXAI'] === 'true'
      ? AuthType.USE_VERTEX_AI
      : process.env['GEMINI_API_KEY']
      ? AuthType.USE_GEMINI
      : undefined;
  const effectiveAuth = enforced || envAuth || selected;
  if (effectiveAuth) {
    await config.refreshAuth(effectiveAuth);
  }
  // Log config snapshot at processing entry (Web UI source)
  try {
    const snapshot = {
      source: 'WEB_UI',
      sessionId: config.getSessionId?.() ?? 'unknown',
      model: config.getModel?.() ?? 'unknown',
      outputFormat: config.getOutputFormat?.(),
      targetDir: config.getTargetDir?.(),
      workingDir: config.getWorkingDir?.(),
      sandboxEnabled:
        typeof config.getSandbox === 'function' ? !!config.getSandbox() : undefined,
    };
    // eslint-disable-next-line no-console
    console.log('[GeminiService] Config (WEB_UI):', JSON.stringify(snapshot));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[GeminiService] Failed to log config snapshot (WEB_UI):', e);
  }
  return { settings, config };
}

// Find an available port, starting from preferredPort
async function findAvailablePort(startPort: number, maxAttempts = 20): Promise<number> {
  let port = startPort;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const isFree = await new Promise<boolean>((resolve) => {
      const tester = net.createServer()
        .once('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') resolve(false);
          else resolve(false);
        })
        .once('listening', () => {
          tester.close(() => resolve(true));
        })
        .listen(port);
    });
    if (isFree) return port;
    port += 1;
  }
  // Fallback: let OS pick a random free port
  return await new Promise<number>((resolve, reject) => {
    const s = net.createServer()
      .once('error', reject)
      .once('listening', () => {
        const address = s.address();
        s.close(() => {
          if (typeof address === 'object' && address && 'port' in address) {
            resolve(address.port);
          } else {
            resolve(startPort);
          }
        });
      })
      .listen(0);
  });
}

// Streaming SSE chat endpoint
app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body ?? {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required as a string.' });
  }

  // Start SSE stream
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const prompt_id = (req.query['prompt_id'] as string) ?? Math.random().toString(16).slice(2);
  const abortController = new AbortController();
  // 用 res.finish 判断是否正常结束；仅在未完成时的 close 触发取消
  let responseFinished = false;
  res.on('finish', () => { responseFinished = true; });
  req.on('close', () => {
    if (!responseFinished) {
      console.warn('[agent] request closed before response finished -> aborting');
      abortController.abort();
    }
  });

  try {
    const { config } = await buildConfig(OutputFormat.TEXT);
    // 使用核心 Turn 流转发 Thought 与 Content 事件
    const client: GeminiClient = config.getGeminiClient();
    await client.startChat();
    const turn = new Turn(client.getChat(), prompt_id);
    let finalText = '';
    for await (const evt of turn.run(config.getModel(), [{ text: prompt }], abortController.signal)) {
      if (evt.type === 'thought') {
        console.log('[chat] event: thought', evt.value);
        // 转发思考主题/短句
        res.write(`data: ${JSON.stringify({ type: 'thought', value: evt.value })}\n\n`);
      } else if (evt.type === 'content') {
        console.log('[chat] event: content len', (evt.value?.length ?? 0));
        finalText += evt.value;
        res.write(`data: ${JSON.stringify({ type: 'content', value: evt.value })}\n\n`);
      } else if (evt.type === 'error') {
        console.error('[chat] event: error', evt.value?.error?.message);
        res.write(`data: ${JSON.stringify({ type: 'error', value: evt.value?.error?.message || 'Unknown error' })}\n\n`);
      }
      // 其他事件（如工具调用、citation、finished）当前前端未消费，暂不转发
    }

    // 若未产生任何 content 文本，回退到一次性生成以保证有最终答案
    if (!finalText) {
      try {
        const { settings: sFallback, config: cFallback } = await buildConfig(OutputFormat.TEXT);
        const svcFallback = new GeminiService(cFallback, sFallback);
        let fallbackText = '';
        for await (const msg of svcFallback.generateContent(prompt, prompt_id + '-fallback')) {
          fallbackText += msg;
        }
        if (fallbackText) {
          finalText = fallbackText;
          res.write(`data: ${JSON.stringify({ type: 'content', value: fallbackText })}\n\n`);
        }
      } catch (fallbackErr) {
        console.error('Fallback generation failed:', fallbackErr);
      }
    }
    // 在结束前，请求模型对最终回答进行“完成步骤”总结，并以 JSON 形式返回
    try {
      const planPrompt = [
        '你将基于以下用户提问与最终回答，输出一个完成用户请求所执行的外显步骤列表。',
        '要求：',
        '1) 不暴露内部思维过程或隐含推理，只描述可被用户理解的实际操作/处理步骤。',
        '2) 使用简短的动词短语，一条一步。',
        '3) 严格返回 JSON：{"steps": ["...", "..."]}，不要附加任何解释。',
        '',
        '【用户提问】:\n' + prompt,
        '【最终回答】:\n' + finalText,
      ].join('\n');
      const { settings: s2, config: c2 } = await buildConfig(OutputFormat.TEXT);
      const svc2 = new GeminiService(c2, s2);
      let stepsText = '';
      for await (const msg of svc2.generateContent(planPrompt, prompt_id + '-plan')) {
        stepsText += msg;
      }
      // 尝试解析为对象，失败则以原文字符串传递
      let stepsPayload: any = null;
      try { stepsPayload = JSON.parse(stepsText); } catch (e) { stepsPayload = { stepsRaw: stepsText }; }
      res.write(`data: ${JSON.stringify({ type: 'steps', value: stepsPayload })}\n\n`);
    } catch (planErr: any) {
      console.error('Error generating steps summary:', planErr);
    }
    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', value: error?.message || 'Unknown error' })}\n\n`);
  } finally {
    res.end();
  }
  return;
});

// Streaming SSE agent endpoint
app.post('/api/agent', async (req, res) => {
  const { agent, inputs, runConfig } = req.body ?? {};
  const agentName = typeof agent === 'string' ? agent : 'codebase_investigator';
  const agentInputs = (inputs && typeof inputs === 'object') ? inputs : {};

  // Start SSE stream
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const abortController = new AbortController();
  // 仅在响应未完成时的连接关闭才触发取消，避免误判为 ABORTED
  let responseFinished = false;
  res.on('finish', () => {
    responseFinished = true;
  });
  req.on('aborted', () => {
    if (!responseFinished && !res.writableEnded) {
      console.warn('[agent] request aborted before response finished -> aborting');
      abortController.abort();
    }
  });

  try {
    const { config } = await buildConfig(OutputFormat.TEXT);
    const registry = new AgentRegistry(config);
    await registry.initialize();
    const def = registry.getDefinition(agentName);
    if (!def) {
      res.write(`data: ${JSON.stringify({ type: 'error', value: `未找到智能体: ${agentName}` })}\n\n`);
      res.end();
      return;
    }

    // 允许通过请求覆盖运行限制（如避免过早终止）
    const overrides = (runConfig && typeof runConfig === 'object') ? runConfig as { max_time_minutes?: number; max_turns?: number } : {};
    const effectiveDef = {
      ...def,
      runConfig: {
        ...def.runConfig,
        // 如果未显式传入，则保持原值
        ...(overrides.max_time_minutes != null ? { max_time_minutes: overrides.max_time_minutes } : {}),
        ...(overrides.max_turns != null ? { max_turns: overrides.max_turns } : {}),
      },
    };

    const onActivity = (activity: SubagentActivityEvent) => {
      try {
        if (activity.type === 'THOUGHT_CHUNK') {
          const text = String(activity.data?.['text'] ?? '');
          if (text) {
            res.write(`data: ${JSON.stringify({ type: 'thought', value: { description: text } })}\n\n`);
          }
        } else if (activity.type === 'ERROR') {
          const msg = String(activity.data?.['message'] ?? '未知错误');
          res.write(`data: ${JSON.stringify({ type: 'error', value: msg })}\n\n`);
        }
        // TOOL_CALL_START/END 可按需扩展到前端
      } catch (_) {}
    };

    const executor = await AgentExecutor.create(effectiveDef, config, onActivity);
    const output = await executor.run(agentInputs, abortController.signal);
    const finalText = String(output.result ?? '');
    if (finalText) {
      res.write(`data: ${JSON.stringify({ type: 'content', value: finalText })}\n\n`);
    }
    // 将终止原因回传，便于前端和用户定位问题
    res.write(`data: ${JSON.stringify({ type: 'end', value: { terminate_reason: output.terminate_reason } })}\n\n`);
  } catch (error) {
    console.error('Error in /api/agent:', error);
    const msg = (error && (error as any).message) ? (error as any).message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ type: 'error', value: msg })}\n\n`);
  } finally {
    res.end();
  }
});

// Non-streaming JSON chat endpoint for simple curl testing
app.post('/api/chat-json', async (req, res) => {
  const { prompt } = req.body ?? {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required as a string.' });
  }
  const prompt_id = (req.query['prompt_id'] as string) ?? Math.random().toString(16).slice(2);
  try {
    const { settings, config } = await buildConfig(OutputFormat.JSON);
    const geminiService = new GeminiService(config, settings);
    let finalJson: string | null = null;
    for await (const message of geminiService.generateContent(prompt, prompt_id)) {
      // In JSON mode, GeminiService yields the final formatted JSON once
      finalJson = message;
    }
    if (!finalJson) {
      return res.status(500).json({ error: 'No response generated.' });
    }
    return res.type('application/json').send(finalJson);
  } catch (error: any) {
    console.error('Error in /api/chat-json:', error);
    return res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// Start server on an available port
(async () => {
  try {
    const port = await findAvailablePort(preferredPort);
    app.listen(port, () => {
      const changed = port !== preferredPort ? ` (fallback from ${preferredPort})` : '';
      console.log(`Gemini Web Server listening at http://localhost:${port}${changed}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();