import { useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Icon } from '@shared/ui/icon';

const scenarios = ['keep', 'share', 'retrieve'] as const;

type Scenario = (typeof scenarios)[number];

export function FileExperience({ reducedMotion }: { reducedMotion: boolean }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Scenario>('keep');

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? (index + 1) % 3
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? (index + 2) % 3
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? 2
              : -1;
    const value = scenarios[next];

    if (!value) {
      return;
    }

    event.preventDefault();
    setSelected(value);
    document.getElementById(`experience-${value}`)?.focus();
  }

  return (
    <section
      className="shell landing-section experience-section"
      id="experience"
      aria-labelledby="experience-title"
    >
      <div className="experience-copy">
        <h2 id="experience-title">{t('landing.experience.title')}</h2>
        <p className="section-description">{t('landing.experience.body')}</p>
        <div
          className="experience-tabs"
          role="tablist"
          aria-label={t('landing.experience.tabs')}
          aria-orientation="vertical"
        >
          {scenarios.map((scenario, index) => (
            <button
              key={scenario}
              type="button"
              role="tab"
              id={`experience-${scenario}`}
              aria-controls="experience-preview"
              aria-selected={selected === scenario}
              tabIndex={selected === scenario ? 0 : -1}
              onClick={() => setSelected(scenario)}
              onKeyDown={(event) => navigate(event, index)}
            >
              <Icon
                name={
                  scenario === 'keep'
                    ? 'folder'
                    : scenario === 'share'
                      ? 'link'
                      : 'download'
                }
              />
              <span>
                <span className="experience-tab-title">{t(`landing.${scenario}`)}</span>
                <span className="experience-tab-description">
                  {t(`landing.${scenario}Body`)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="experience-stage" data-reveal="rise">
        <div
          id="experience-preview"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby={`experience-${selected}`}
          data-active={selected}
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={selected}
              className="experience-scene"
              data-scene={selected}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
              transition={{ duration: reducedMotion ? 0 : 0.26, ease: [0.16, 1, 0.3, 1] }}
            >
              {selected === 'keep' ? (
                <div className="file-card-stack">
                  {(['documents', 'photos', 'projects'] as const).map((kind, index) => (
                    <div
                      className={`file-story-card file-story-card-${index}`}
                      key={kind}
                    >
                      <Icon
                        name={index === 0 ? 'file' : index === 1 ? 'image' : 'folder'}
                      />
                      <span>{t(`landing.collection.${kind}`)}</span>
                      <span className="story-card-detail">
                        {t(`landing.collection.${kind}Body`)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : selected === 'share' ? (
                <div className="share-scene">
                  <div className="file-story-card">
                    <Icon name="file" />
                    <span>{t('landing.sharing.document')}</span>
                    <span className="story-card-detail">PDF</span>
                  </div>
                  <div className="scene-connector" aria-hidden="true" />
                  <div className="file-link-pill">
                    <Icon name="link" />
                    {t('landing.sharing.linkLabel')}
                  </div>
                </div>
              ) : (
                <div className="retrieve-scene">
                  <div className="file-story-card">
                    <Icon name="folder" />
                    <span>{t('landing.experience.collection')}</span>
                    <span className="story-card-detail">
                      {t('landing.collection.caption')}
                    </span>
                  </div>
                  <span className="download-symbol" aria-hidden="true">
                    <Icon name="download" />
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="experience-caption">{t(`landing.experience.${selected}Caption`)}</p>
      </div>
    </section>
  );
}
