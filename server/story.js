export const GENRES = [
  'Adventure',
  'Comedy',
  'Fantasy',
  'Mystery',
  'Science fiction',
  'Slice of life',
];

export const ART_STYLES = [
  'Ink & watercolor',
  'Retro screenprint',
  'Saturday morning',
  'Graphic novel',
  'Paper collage',
];

export function validateStoryRequest(body = {}) {
  const idea = typeof body.idea === 'string' ? body.idea.trim() : '';
  const genre = typeof body.genre === 'string' ? body.genre : '';
  const artStyle = typeof body.artStyle === 'string' ? body.artStyle : '';
  const panelCount = Number(body.panelCount);

  if (idea.length < 8 || idea.length > 700) {
    return { error: 'Give your story idea between 8 and 700 characters.' };
  }
  if (!GENRES.includes(genre)) {
    return { error: 'Choose one of the available story genres.' };
  }
  if (!ART_STYLES.includes(artStyle)) {
    return { error: 'Choose one of the available art styles.' };
  }
  if (!Number.isInteger(panelCount) || panelCount < 3 || panelCount > 6) {
    return { error: 'Choose between 3 and 6 panels.' };
  }

  return { value: { idea, genre, artStyle, panelCount } };
}

export function normalizeStory(value, expectedPanelCount) {
  if (!value || typeof value !== 'object') {
    throw new Error('The story response was not a JSON object. Please try again.');
  }

  const title = typeof value.title === 'string' ? value.title.trim() : '';
  const panels = Array.isArray(value.panels) ? value.panels : [];
  if (!title || title.length > 100 || panels.length !== expectedPanelCount) {
    throw new Error('The generated story was incomplete. Please try again.');
  }

  const normalizedPanels = panels.map((panel, index) => {
    const caption = typeof panel?.caption === 'string' ? panel.caption.trim() : '';
    const description = typeof panel?.description === 'string' ? panel.description.trim() : '';
    const imagePrompt = typeof panel?.imagePrompt === 'string' ? panel.imagePrompt.trim() : '';
    if (!caption || !description || !imagePrompt || caption.length > 220 || description.length > 500 || imagePrompt.length > 900) {
      throw new Error(`Panel ${index + 1} was incomplete. Please try generating the story again.`);
    }
    return { number: index + 1, caption, description, imagePrompt };
  });

  return { title, panels: normalizedPanels };
}