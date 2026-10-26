# CapWords recognition Worker

This Worker exposes `POST /recognize` and `GET /health`. It authenticates an Appwrite user JWT by calling Appwrite Cloud `GET /account`, requires `emailVerification: true`, and consumes at most 20 attempts per verified user per UTC day using the D1 `USAGE` binding. Images are validated as JPEG, PNG, or WebP data URIs and are never persisted.

## Deploy

From this directory, with Wrangler already installed and authenticated:

```sh
wrangler d1 create capwords-usage
# Put the returned database name/id and real public Appwrite values in wrangler.jsonc.
wrangler d1 execute capwords-usage --remote --file=./schema.sql
wrangler deploy
```

Do not put Appwrite API keys, JWTs, or other secrets in this file. Main project provisioning supplies the Appwrite project, private media bucket, and app origin. Configure only public `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, and comma-separated `ALLOWED_ORIGINS` values here. The AI binding must be present; missing AI or D1 bindings fail closed with 503.

Recognition uses Cloudflare-hosted `@cf/mistralai/mistral-small-3.1-24b-instruct`, whose publisher model card lists Apache 2.0 licensing and native vision support. The Worker sends a validated `data:image/jpeg|png|webp;base64,...` image in the OpenAI-compatible Vision `messages` branch: a system message plus a user message containing exact `text` and `image_url` content parts. The user text supplies the learning/native languages and prominent-object-or-word request; the system message treats image text as untrusted data. It also sends `guided_json`, `max_tokens`, `temperature`, and `stream: false`, then accepts either `{ response: string }` or a direct object, strips an optional JSON fence, and emits only the canonical bounded fields. The published raw synchronous input schema only shows the Prompt branch with top-level `prompt`, while the official API `GET /accounts/{id}/ai/models/schema?model=...` response exposes the Messages + Vision branch used here. Cloudflare Workers Free currently includes 10,000 Neurons/day; no paid plan or billing configuration is required within that allocation. No image, JWT, prompt, or personal content is logged or retained.

Official references: [model documentation](https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/), [raw synchronous input schema](https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/sync-input.json), [Workers AI pricing/free allocation](https://developers.cloudflare.com/workers-ai/platform/pricing/), and [Mistral model card/license](https://huggingface.co/mistralai/Mistral-Small-3.1-24B-Instruct-2503).
