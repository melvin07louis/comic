import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStory, validateStoryRequest } from './story.js';

test('validates and trims a story request', () => {
  const result = validateStoryRequest({
    idea: '  A tiny moon moves into a lighthouse.  ',
    genre: 'Fantasy',
    artStyle: 'Ink & watercolor',
    panelCount: '4',
  });
  assert.equal(result.value.idea, 'A tiny moon moves into a lighthouse.');
  assert.equal(result.value.panelCount, 4);
});

test('rejects invalid genres and panel counts', () => {
  assert.match(validateStoryRequest({ idea: 'A story idea', genre: 'Noir', artStyle: 'Graphic novel', panelCount: 4 }).error, /genre/);
  assert.match(validateStoryRequest({ idea: 'A story idea', genre: 'Mystery', artStyle: 'Graphic novel', panelCount: 8 }).error, /3 and 6/);
});

test('normalizes panels to an ordered, complete story', () => {
  const story = normalizeStory({
    title: 'Moonlight Move',
    panels: [
      { caption: 'A new neighbor.', description: 'The moon arrives.', imagePrompt: 'A moon at a lighthouse.' },
      { caption: 'The keeper waves.', description: 'A greeting.', imagePrompt: 'A keeper waves.' },
    ],
  }, 2);
  assert.deepEqual(story.panels.map((panel) => panel.number), [1, 2]);
});

test('rejects a response with a missing panel field', () => {
  assert.throws(() => normalizeStory({ title: 'Incomplete', panels: [{ caption: 'Only a caption' }] }, 1), /incomplete/);
});