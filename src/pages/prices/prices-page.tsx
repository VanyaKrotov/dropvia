import { useTranslation } from 'react-i18next';
import { PricingPlans, PlanComparison } from '@widgets/pricing/pricing';
import { AccordionItem } from '@shared/ui/accordion-item';

export function PricesPage() {
  const { t } = useTranslation();

  return (
    <div className="shell">
      <header className="page-heading centered">
        <p className="eyebrow">Dropvia</p>
        <h1>{t('prices.title')}</h1>
        <p>{t('prices.body')}</p>
      </header>
      <PricingPlans headingLevel={2} comparisonHref="#plan-comparison" />
      <p className="plan-billing-note">{t('prices.detail')}</p>
      <section className="section comparison" id="plan-comparison">
        <h2>{t('prices.compare')}</h2>
        <PlanComparison />
      </section>
      <section className="section faq-section">
        <h2>{t('prices.faqTitle')}</h2>
        <div>
          {[1, 2, 3].map((i) => (
            <AccordionItem key={i} title={t(`prices.faq${i}`)}>
              <p>{t(`prices.answer${i}`)}</p>
            </AccordionItem>
          ))}
        </div>
      </section>
    </div>
  );
}
