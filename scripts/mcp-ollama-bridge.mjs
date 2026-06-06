/* global Buffer, console, fetch, process */

const OLLAMA_HOST = (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(/\/$/, '');
const MCP_PROTOCOL_VERSION = '2024-11-05';

function jsonRpcSuccess(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function jsonRpcError(id, code, message, data) {
  return {
    jsonrpc: '2.0',
    id,
    error: data === undefined ? { code, message } : { code, message, data },
  };
}

function makeTextContent(text) {
  return [{ type: 'text', text }];
}

async function ollamaJson(path, init) {
  const response = await fetch(`${OLLAMA_HOST}${path}`, {
    headers: {
      'content-type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const detail =
      typeof body === 'string'
        ? body
        : body && typeof body === 'object'
          ? JSON.stringify(body)
          : 'Unknown Ollama error';
    throw new Error(`Ollama ${path} failed with ${response.status}: ${detail}`);
  }

  return body;
}

async function listModels() {
  const data = await ollamaJson('/api/tags');
  const models = Array.isArray(data.models) ? data.models : [];
  return models.map((model) => ({
    name: model.name,
    model: model.model,
    family: model.details?.family || '',
    parameterSize: model.details?.parameter_size || '',
    quantizationLevel: model.details?.quantization_level || '',
    capabilities: Array.isArray(model.capabilities) ? model.capabilities : [],
  }));
}

async function chatModel(args) {
  const model = typeof args.model === 'string' && args.model.trim() ? args.model.trim() : 'gemma4:latest';
  const messages = [];

  if (typeof args.system === 'string' && args.system.trim()) {
    messages.push({ role: 'system', content: args.system.trim() });
  }

  if (Array.isArray(args.messages) && args.messages.length > 0) {
    for (const message of args.messages) {
      if (!message || typeof message !== 'object') continue;
      const role = typeof message.role === 'string' ? message.role : 'user';
      const content =
        typeof message.content === 'string'
          ? message.content
          : Array.isArray(message.content)
            ? message.content
                .map((part) => (typeof part === 'string' ? part : part?.text || ''))
                .join('\n')
            : '';
      if (content) {
        messages.push({ role, content });
      }
    }
  } else if (typeof args.prompt === 'string' && args.prompt.trim()) {
    messages.push({ role: 'user', content: args.prompt.trim() });
  }

  if (messages.length === 0) {
    throw new Error('Provide either `prompt` or `messages`.');
  }

  const body = await ollamaJson('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        temperature:
          typeof args.temperature === 'number' && Number.isFinite(args.temperature)
            ? args.temperature
            : undefined,
      },
    }),
  });

  const content = body?.message?.content || '';
  return {
    model,
    content,
    raw: body,
  };
}

const tools = [
  {
    name: 'ollama_list_models',
    description: 'List models currently available in the local Ollama server.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: 'ollama_chat',
    description: 'Send a chat request to a local Ollama model and return the response.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        model: { type: 'string', description: 'Ollama model tag, for example gemma4:latest or qwen3.6:27b.' },
        prompt: { type: 'string', description: 'User prompt for a single-turn request.' },
        system: { type: 'string', description: 'Optional system instruction.' },
        messages: {
          type: 'array',
          description: 'Optional OpenAI-style message list for multi-turn chat.',
          items: {
            type: 'object',
            additionalProperties: true,
            properties: {
              role: { type: 'string' },
              content: {},
            },
            required: ['role', 'content'],
          },
        },
        temperature: { type: 'number', description: 'Sampling temperature.' },
      },
    },
  },
];

function sendMessage(message) {
  const json = JSON.stringify(message);
  const payload = `Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n${json}`;
  process.stdout.write(payload);
}

let buffer = '';
let draining = false;

async function handleRequest(message) {
  const { id, method, params } = message;

  try {
    switch (method) {
      case 'initialize':
        return jsonRpcSuccess(id, {
          protocolVersion: MCP_PROTOCOL_VERSION,
          serverInfo: {
            name: 'vivah-ollama-bridge',
            version: '1.0.0',
          },
          capabilities: {
            tools: {},
          },
        });

      case 'initialized':
        return null;

      case 'tools/list':
        return jsonRpcSuccess(id, {
          tools,
        });

      case 'tools/call': {
        const name = params?.name;
        const args = params?.arguments || {};

        if (name === 'ollama_list_models') {
          const models = await listModels();
          return jsonRpcSuccess(id, {
            content: makeTextContent(JSON.stringify({ models }, null, 2)),
            isError: false,
          });
        }

        if (name === 'ollama_chat') {
          const result = await chatModel(args);
          return jsonRpcSuccess(id, {
            content: makeTextContent(
              JSON.stringify(
                {
                  model: result.model,
                  content: result.content,
                },
                null,
                2,
              ),
            ),
            isError: false,
          });
        }

        return jsonRpcError(id, -32601, `Unknown tool: ${String(name)}`);
      }

      default:
        return jsonRpcError(id, -32601, `Unknown method: ${String(method)}`);
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown error';
    return jsonRpcError(id, -32603, messageText);
  }
}

function tryConsumeMessage() {
  const headerEnd = buffer.indexOf('\r\n\r\n');
  if (headerEnd === -1) return null;

  const headerText = buffer.slice(0, headerEnd);
  const contentLengthMatch = headerText.match(/Content-Length:\s*(\d+)/i);
  if (!contentLengthMatch) {
    throw new Error(`Missing Content-Length header: ${headerText}`);
  }

  const contentLength = Number.parseInt(contentLengthMatch[1], 10);
  const bodyStart = headerEnd + 4;
  if (buffer.length < bodyStart + contentLength) return null;

  const body = buffer.slice(bodyStart, bodyStart + contentLength);
  buffer = buffer.slice(bodyStart + contentLength);
  return JSON.parse(body);
}

async function main() {
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    buffer += chunk;
    void drain();
  });

  process.stdin.resume();
}

async function drain() {
  if (draining) return;
  draining = true;

  try {
    while (true) {
      const message = tryConsumeMessage();
      if (!message) return;

      try {
        const response = await handleRequest(message);
        if (response) {
          sendMessage(response);
        }
      } catch (error) {
        const messageText = error instanceof Error ? error.message : 'Unknown server error';
        if (message?.id !== undefined) {
          sendMessage(jsonRpcError(message.id, -32603, messageText));
        } else {
          console.error(messageText);
        }
      }
    }
  } finally {
    draining = false;
    if (buffer.includes('\r\n\r\n')) {
      void drain();
    }
  }
}

await main();
