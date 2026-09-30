# ComicCraft

ComicCraft turns a short story idea into a structured comic script, then creates an illustration for each panel with Gemini. The Gemini key stays on the Express server and is never sent to the browser.

## Requirements

- Node.js 20.19 or newer, which includes npm
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Network access to the Gemini API

Image generation model availability and quotas depend on the Google account and API project. Change `GEMINI_IMAGE_MODEL` in `.env` if your project uses a different supported image-generation model.

## VS Code setup

1. Open this folder in VS Code.
2. Install Node.js 20.19+ if it is not already installed, then restart VS Code so its terminal sees `node` and `npm` on `PATH`.
3. In the integrated terminal, install dependencies:

   ```powershell
   npm install
   ```

4. Copy `.env.example` to `.env` and replace the placeholder with your Gemini API key. Never commit `.env` or share the key in client-side code.
5. Start both the API and web app:

   ```powershell
   npm run dev
   ```

6. Open `http://localhost:5173`. The API listens on `http://localhost:3000`; Vite proxies `/api` requests to it.

You can also press `Ctrl+Shift+P`, choose **Tasks: Run Task**, and select **ComicCraft: Start development**.

## Use the app

1. Enter an idea of 8–700 characters, select a genre and art direction, and choose 3–6 panels.
2. Select **Make my comic** to ask Gemini for the title, captions, panel descriptions, and illustration prompts.
3. Select the image button on a panel to generate or regenerate that panel's artwork. **Generate all artwork** fills in every panel that does not yet have an image.
4. Use the print button to print the comic or save it as a PDF from the browser's print dialog.

Story generation and image generation are separate requests. A panel image failure does not discard the generated story; retry that panel after checking the API key, model access, and quota.

## Test and build

Run the story validation unit tests:

```powershell
npm test
```

Run tests and create an optimized frontend build:

```powershell
npm run check
```

To run the built app with Express after building, use PowerShell:

```powershell
$env:NODE_ENV = 'production'
npm start
```

Then open `http://localhost:3000`. `GET /api/health` reports whether the key is configured and which models the server will use. The endpoint does not reveal the key.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | none | Server-side Gemini API key; required for generation |
| `GEMINI_TEXT_MODEL` | `gemini-2.5-flash` | Story and panel prompt generation |
| `GEMINI_IMAGE_MODEL` | `gemini-2.5-flash-image` | Comic panel illustration generation |
| `PORT` | `3000` | Express API and production web server port |

The API applies a per-IP request limit. The project currently keeps a generated comic in the browser session only; it does not provide user accounts or cloud persistence.