import { useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  ImagePlus,
  LoaderCircle,
  Minus,
  Plus,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

const examples = [
  'A shy lighthouse keeper discovers that the moon has come loose from the sky.',
  'A courier robot delivers one last letter to a city that has forgotten how to dream.',
  'Two rival bakers enter a midnight pie contest judged by a very picky dragon.',
];

const genreOptions = ['Adventure', 'Comedy', 'Fantasy', 'Mystery', 'Science fiction', 'Slice of life'];
const styleOptions = ['Ink & watercolor', 'Retro screenprint', 'Saturday morning', 'Graphic novel', 'Paper collage'];

async function requestJson(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The request failed. Please try again.');
  return data;
}

export default function App() {
  const [idea, setIdea] = useState('');
  const [genre, setGenre] = useState('Adventure');
  const [artStyle, setArtStyle] = useState('Ink & watercolor');
  const [panelCount, setPanelCount] = useState(4);
  const [story, setStory] = useState(null);
  const [images, setImages] = useState({});
  const [loadingStory, setLoadingStory] = useState(false);
  const [loadingImages, setLoadingImages] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function createStory(event) {
    event?.preventDefault();
    setError('');
    setNotice('');
    setLoadingStory(true);
    try {
      const data = await requestJson('/api/stories', {
        method: 'POST',
        body: JSON.stringify({ idea, genre, artStyle, panelCount }),
      });
      setStory(data.story);
      setImages({});
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingStory(false);
    }
  }

  async function createPanelImage(panel) {
    setError('');
    setNotice('');
    setLoadingImages((current) => ({ ...current, [panel.number]: true }));
    try {
      const data = await requestJson('/api/panels/image', {
        method: 'POST',
        body: JSON.stringify({ prompt: panel.imagePrompt, artStyle }),
      });
      setImages((current) => ({ ...current, [panel.number]: data.image }));
    } catch (requestError) {
      setError(`Panel ${panel.number}: ${requestError.message}`);
    } finally {
      setLoadingImages((current) => ({ ...current, [panel.number]: false }));
    }
  }

  async function createAllImages() {
    for (const panel of story?.panels ?? []) {
      if (!images[panel.number]) await createPanelImage(panel);
    }
  }

  function useExample() {
    setIdea(examples[Math.floor(Math.random() * examples.length)]);
    setError('');
  }

  function printComic() {
    window.print();
  }

  const completedImages = Object.keys(images).length;

  return (
    <div className="app-shell">
      <aside className="rail" aria-label="Main navigation">
        <a className="brand-mark" href="#top" aria-label="ComicCraft home"><span>cc</span><i>✳</i></a>
        <div className="rail-rule" />
        <button className="rail-button is-active" title="Story studio" aria-label="Story studio">
          <BookOpen size={18} strokeWidth={1.8} />
        </button>
        <button className="rail-button" title="Help" aria-label="Help" onClick={() => setNotice('Your stories and artwork are created with Gemini. Add your API key in .env to get started.')}>
          <CircleHelp size={18} strokeWidth={1.8} />
        </button>
        <span className="rail-bottom">CC / 01</span>
      </aside>

      <div className="app-main" id="top">
        <header className="topbar">
          <div className="topbar-brand"><span className="wordmark">COMICCRAFT</span><span className="topbar-slash">/</span><span className="topbar-location">STORY STUDIO</span></div>
          <div className="topbar-right"><span className="status-dot" /> GEMINI STUDIO <span className="topbar-divider" /> V 1.0</div>
        </header>

        <main className="workspace">
          <section className="welcome-row">
            <div>
              <p className="eyebrow"><span className="eyebrow-line" /> YOUR IDEA, IN PANELS</p>
              <h1>Make a little <em>story.</em></h1>
              <p className="welcome-copy">Give a thought a plot, a look, and a life of its own.</p>
            </div>
            <div className="edition-stamp" aria-hidden="true"><span>ISSUE</span><strong>001</strong><i>✳</i></div>
          </section>

          <div className="studio-grid">
            <section className="brief-panel" aria-labelledby="brief-heading">
              <div className="section-heading">
                <span className="step-number">01</span>
                <div><h2 id="brief-heading">The brief</h2><p>Start with a spark. Shape the rest.</p></div>
              </div>

              <form onSubmit={createStory}>
                <label className="field-label" htmlFor="story-idea">STORY SPARK <span>REQUIRED</span></label>
                <textarea
                  id="story-idea"
                  value={idea}
                  onChange={(event) => setIdea(event.target.value.slice(0, 700))}
                  placeholder="A retired astronaut opens a flower shop on Mars..."
                  minLength={8}
                  maxLength={700}
                  required
                />
                <div className="textarea-footer"><button type="button" className="text-action" onClick={useExample}><Sparkles size={13} /> Surprise me</button><span>{idea.length} / 700</span></div>

                <div className="field-grid">
                  <div className="field-group">
                    <label className="field-label" htmlFor="genre">GENRE</label>
                    <div className="select-wrap"><select id="genre" value={genre} onChange={(event) => setGenre(event.target.value)}>{genreOptions.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={15} /></div>
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="art-style">ART DIRECTION</label>
                    <div className="select-wrap"><select id="art-style" value={artStyle} onChange={(event) => setArtStyle(event.target.value)}>{styleOptions.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={15} /></div>
                  </div>
                </div>

                <div className="panel-count-row">
                  <div><span className="field-label">PANEL COUNT</span><span className="field-hint">A quick read or a slow burn.</span></div>
                  <div className="stepper" aria-label={`${panelCount} panels`}>
                    <button type="button" title="Remove a panel" aria-label="Remove a panel" onClick={() => setPanelCount((count) => Math.max(3, count - 1))} disabled={panelCount <= 3}><Minus size={14} /></button>
                    <span>{String(panelCount).padStart(2, '0')}</span>
                    <button type="button" title="Add a panel" aria-label="Add a panel" onClick={() => setPanelCount((count) => Math.min(6, count + 1))} disabled={panelCount >= 6}><Plus size={14} /></button>
                  </div>
                </div>

                {error && <p className="inline-message error-message" role="alert">{error}</p>}
                {notice && <p className="inline-message notice-message" role="status">{notice}</p>}
                <button className="create-button" type="submit" disabled={loadingStory || idea.trim().length < 8}>
                  {loadingStory ? <><LoaderCircle className="spin" size={17} /> WRITING YOUR STORY</> : <><WandSparkles size={16} /> MAKE MY COMIC <ArrowRight size={16} /></>}
                </button>
                <p className="form-footnote">A story first. Then bring each panel to life.</p>
              </form>
            </section>

            <section className="story-area" aria-labelledby="story-heading" aria-live="polite">
              <div className="story-toolbar">
                <div className="section-heading compact-heading">
                  <span className="step-number">02</span>
                  <div><h2 id="story-heading">Your comic</h2><p>{story ? `${story.panels.length} panels · ${artStyle}` : 'Your next little world starts here.'}</p></div>
                </div>
                {story && <div className="story-actions"><span className="art-progress">{completedImages}/{story.panels.length} ART</span><button className="icon-action" title="Print or save as PDF" aria-label="Print or save as PDF" onClick={printComic}><ArrowDownToLine size={16} /></button></div>}
              </div>

              {story ? (
                <div className="comic-result">
                  <div className="comic-title-row"><div><span className="comic-kicker">A {genre.toLowerCase()} comic</span><h3>{story.title}</h3></div><span className="comic-edition">CC · 001</span></div>
                  <div className="panel-grid">
                    {story.panels.map((panel) => (
                      <article className="comic-panel" key={panel.number}>
                        <div className={`panel-art${images[panel.number] ? ' has-image' : ''}`}>
                          {images[panel.number] ? <img src={images[panel.number]} alt={panel.description} /> : loadingImages[panel.number] ? <div className="art-loading"><LoaderCircle className="spin" size={22} /><span>INKING PANEL {String(panel.number).padStart(2, '0')}</span></div> : <div className={`art-placeholder art-${(panel.number - 1) % 4}`}><span className="placeholder-index">{String(panel.number).padStart(2, '0')}</span><span className="placeholder-spark">✳</span><span className="placeholder-note">ARTWORK<br />GOES HERE</span></div>}
                          {!loadingImages[panel.number] && <button className="panel-image-button" onClick={() => createPanelImage(panel)} title={images[panel.number] ? `Regenerate panel ${panel.number} artwork` : `Generate panel ${panel.number} artwork`} aria-label={images[panel.number] ? `Regenerate panel ${panel.number} artwork` : `Generate panel ${panel.number} artwork`}><ImagePlus size={15} /></button>}
                        </div>
                        <div className="panel-caption"><span className="panel-label">PANEL {String(panel.number).padStart(2, '0')}</span><p>{panel.caption}</p></div>
                      </article>
                    ))}
                  </div>
                  <div className="comic-footer"><span><Check size={14} /> STORYBOARDED</span><button className="text-action" onClick={createAllImages} disabled={completedImages === story.panels.length || Object.values(loadingImages).some(Boolean)}>{Object.values(loadingImages).some(Boolean) ? <><LoaderCircle className="spin" size={13} /> Painting panels...</> : <><RefreshCw size={13} /> Generate all artwork</>}</button></div>
                </div>
              ) : (
                <div className="empty-board">
                  <div className="empty-board-top"><span>CANVAS / 001</span><span>WAITING FOR A STORY</span></div>
                  <div className="empty-art" aria-hidden="true"><span className="empty-sun" /><span className="empty-hill hill-back" /><span className="empty-hill hill-front" /><span className="empty-orbit">✳</span><span className="empty-panel-mark">04</span></div>
                  <div className="empty-board-bottom"><div><span className="empty-bottom-label">THE FIRST FRAME</span><span>Every good comic starts somewhere.</span></div><span className="empty-arrow"><ArrowRight size={17} /></span></div>
                </div>
              )}
              <div className="studio-note"><span className="note-star">✳</span><span>Every panel is its own little universe. Make them one at a time, or all together.</span></div>
            </section>
          </div>
        </main>

        <footer className="page-footer"><span>COMICCRAFT STUDIO</span><span>MADE OF STORIES & A LITTLE MACHINE MAGIC</span><span>2026</span></footer>
      </div>
    </div>
  );
}