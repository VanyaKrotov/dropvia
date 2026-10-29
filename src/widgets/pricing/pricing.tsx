import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';
import {
  plans,
  comparisonFeatures,
  formatEuro,
  type PricingPlan,
  type PlanFeature,
} from '@entities/plan/model';
import { Icon } from '@shared/ui/icon';
import { localeFromPath, localizedPath } from '@shared/i18n/config';

function labels(plan: PricingPlan, t: TFunction) {
  return {
    users: t(plan.billing === 'account' ? 'prices.singleUser' : 'prices.minimumUsers', {
      count: plan.minimumUsers,
    }),
    storage: t(
      plan.billing === 'account' ? 'prices.personalStorage' : 'prices.teamStorage',
      { count: plan.storageTb },
    ),
    recovery:
      plan.recoveryDays === 365
        ? t('prices.recoveryYear')
        : t('prices.recoveryDays', { count: plan.recoveryDays }),
    cycle: t(plan.billing === 'account' ? 'prices.perMonth' : 'prices.perUserMonth'),
  };
}

function featureLabel(plan: PricingPlan, feature: PlanFeature, t: TFunction) {
  return t(
    `prices.options.${feature === 'administration' && plan.id === 'advanced' ? 'advancedAdministration' : feature}`,
  );
}

export function PricingPlans({
  headingLevel,
  comparisonHref,
  actionIcon,
}: {
  headingLevel: 2 | 3;
  comparisonHref: string;
  actionIcon?: ReactNode;
}) {
  const { t } = useTranslation();
  const locale = localeFromPath(useLocation().pathname);
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <div className="plans-grid pricing-plans">
      {plans.map((plan) => {
        const text = labels(plan, t);
        const options = [
          text.users,
          text.storage,
          featureLabel(plan, 'devices', t),
          text.recovery,
          ...plan.features
            .filter((feature) => feature !== 'devices')
            .map((feature) => featureLabel(plan, feature, t)),
        ];

        return (
          <article
            className={`plan panel plan-${plan.id}`}
            key={plan.id}
            data-plan={plan.id}
          >
            <p className="plan-audience">{t(`prices.${plan.id}.description`)}</p>
            <Heading>{plan.name}</Heading>
            <p className="plan-price">
              <span>{formatEuro(plan.monthlyPrice, locale)}</span>
              <span className="plan-cycle">{text.cycle}</span>
            </p>
            <Link className="button" to={localizedPath('/', locale) + '#request-access'}>
              {t('common.request')}
              {actionIcon}
            </Link>
            <ul>
              {options.map((option) => (
                <li key={option}>
                  <Icon name="check" />
                  <span>{option}</span>
                </li>
              ))}
            </ul>
            <Link className="plan-details-link" to={comparisonHref}>
              {t('prices.allFeatures')}
              <Icon name="arrow" />
            </Link>
          </article>
        );
      })}
    </div>
  );
}

export function PlanComparison() {
  const { t } = useTranslation();
  const locale = localeFromPath(useLocation().pathname);

  return (
    <div
      className="table-scroll"
      tabIndex={0}
      role="region"
      aria-label={t('prices.compare')}
    >
      <table>
        <caption className="sr-only">{t('prices.compare')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('prices.feature')}</th>
            {plans.map((plan) => (
              <th scope="col" key={plan.id}>
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{t('prices.monthlyPrice')}</th>
            {plans.map((plan) => (
              <td key={plan.id}>
                {formatEuro(plan.monthlyPrice, locale)}
                <span className="comparison-detail">{labels(plan, t).cycle}</span>
              </td>
            ))}
          </tr>
          {(['users', 'storage', 'recovery'] as const).map((key) => (
            <tr key={key}>
              <th scope="row">{t(`prices.rows.${key}`)}</th>
              {plans.map((plan) => (
                <td key={plan.id}>{labels(plan, t)[key]}</td>
              ))}
            </tr>
          ))}
          {comparisonFeatures.map((feature) => (
            <tr key={feature}>
              <th scope="row">{t(`prices.rows.${feature}`)}</th>
              {plans.map((plan) => (
                <td key={plan.id}>
                  {plan.features.includes(feature) ? (
                    feature === 'administration' ? (
                      featureLabel(plan, feature, t)
                    ) : (
                      t('prices.included')
                    )
                  ) : (
                    <>
                      <span aria-hidden="true">—</span>
                      <span className="sr-only">{t('prices.notIncluded')}</span>
                    </>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
