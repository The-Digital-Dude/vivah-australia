# Ollama MCP Bridge

This repo now includes a small local MCP server that exposes your Ollama models to MCP-capable clients.

## What it provides

- `ollama_list_models` lists the models available from `http://127.0.0.1:11434`
- `ollama_chat` sends a chat request to a local Ollama model

## Run it manually

```powershell
pnpm mcp:ollama
```

## Default model tags

- `gemma4:latest`
- `qwen3.6:27b`

You can override the Ollama host with `OLLAMA_HOST` if needed.

