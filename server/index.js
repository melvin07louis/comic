import 'dotenv/config';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { GoogleGenAI, Type } from '@google/genai';
import { ART_STYLES, GENRES, normalizeStory, validateStoryRequest } from './story.js';

const app = express();
const port = Number(process.env.PORT) || 3000;
const textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
const imageModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    configured: Boolean(process.env.GEMINI_API_KEY),
    textModel,
    imageModel,
  });
});

function getClient(response) {
  if (!process.env.GEMINI_API_KEY) {
    response.status(503).json({ error: 'Gemini is not configured. Add GEMINI_API_KEY to your .env file, then restart the server.' });
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

app.get('/api/options', (_request, response) => {
  response.json({ genres: GENRES, artStyles: ART_STYLES, panelCounts: [3, 4, 5, 6] });
});

app.post('/api/stories', async (request, response, next) => {
  const validation = validateStoryRequest(request.body);
  if (validation.error) return response.status(400).json({ error: validation.error });

  const client = getClient(response);
  if (!client) return;
  const { idea, genre, artStyle, panelCount } = validation.value;

  try {
    const result = await client.models.generateContent({
      model: textModel,
      contents: `Create an original ${genre.toLowerCase()} comic in exactly ${panelCount} panels.\n\nStory seed: ${idea}\n\nReturn a concise, satisfying beginning-middle-end arc. Each caption is one short line for the reader. The description says what is visibly happening in that panel. The imagePrompt describes only the visual artwork for one panel in this art direction: ${artStyle}. Keep recurring characters visually consistent; describe their appearance consistently in every panel where they appear. Do not put lettering, words, speech balloons, logos, panel borders, or watermarks inside the generated image; captions will be typeset separately.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            panels: {
              type: Type.ARRAY,
              minItems: panelCount,
              maxItems: panelCount,
              items: {
                type: Type.OBJECT,
                properties: {
                  caption: { type: Type.STRING },
                  description: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                },
                required: ['caption', 'description', 'imagePrompt'],
              },
            },
          },
          required: ['title', 'panels'],
        },
      },
    });

    const text = result.text;
    if (!text) throw new Error('Gemini returned an empty story. Please try again.');
    response.json({ story: normalizeStory(JSON.parse(text), panelCount) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/panels/image', async (request, response, next) => {
  const prompt = typeof request.body?.prompt === 'string' ? request.body.prompt.trim() : '';
  const artStyle = typeof request.body?.artStyle === 'string' ? request.body.artStyle : '';
  if (!prompt || prompt.length > 1400) return response.status(400).json({ error: 'A visual prompt between 1 and 1,400 characters is required.' });
  if (!ART_STYLES.includes(artStyle)) return response.status(400).json({ error: 'Choose one of the available art styles.' });

  const client = getClient(response);
  if (!client) return;

  try {
    const result = await client.models.generateContent({
      model: imageModel,
      contents: `Create one polished comic-book panel illustration. Art direction: ${artStyle}. Scene: ${prompt}. Compose as a landscape 4:3 image with clear readable silhouettes and a single focal moment. No text, lettering, speech bubbles, logos, borders, or watermarks.`,
      config: { responseModalities: ['IMAGE'] },
    });
    const parts = result.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part) => part.inlineData?.data);
    if (!imagePart) throw new Error('Gemini did not return an image. Check that your API key and image model have image generation access.');
    response.json({ image: `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}` });
  } catch (error) {
    next(error);
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('/{*splat}', (_request, response) => response.sendFile('index.html', { root: 'dist' }));
}

app.use((error, _request, response, _next) => {
  console.error('Request failed:', error);
  if (response.headersSent) return;
  const message = error?.status === 429
    ? 'Gemini rate limit reached. Wait a moment and try again.'
    : 'The Gemini request failed. Check your API key, model access, and connection, then try again.';
  response.status(502).json({ error: message });
});

app.listen(port, () => {
  console.log(`ComicCraft API listening on http://localhost:${port}`);
});