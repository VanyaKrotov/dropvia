# Approved pricing catalog

**Spec:** latest owner request and supplied pricing screenshot. Add prices/options to landing and pricing page. Preserve Dropvia design, EN/RU, system themes and request-access CTA. No checkout, trial, payment collection, file backend or deployment requested.

**Approved commercial specification:** Plus€9.99/account/month,1person,2TB,all devices,30-day deleted-file recovery. Standard€12/user/month,minimum1user,from3TB shared team storage,all devices,180-day recovery,branded sharing,team folders,team access management,groups/roles,administration tools. Advanced€18/user/month,minimum3users,from15TB shared team storage,all devices,1-year recovery,branded sharing,team folders,access management,groups/roles,multilevel administration,end-to-end encryption,compliance controls,SSO.

**Excluded from both surfaces:** PDF editing/signatures,AI integration/agents,key management,password protection,file forwarding/transfer allowances. Generic file sharing remains the existing product purpose; branded sharing is retained as an explicitly included screenshot option.

- [x] Add a failing browser contract for Plus/Standard/Advanced, localized euro prices, complete features, exclusions and comparison values.
- [x] Create `entities/plan/model.ts` as the numeric/availability source. Add `widgets/pricing/pricing.tsx` for shared cards and full comparison, with localized Intl pricing and native accessible table.
- [x] Use the same cards on landing and /prices; replace outdated Personal/Custom offers, update prices/FAQ/API copy in both languages. Keep billing account-vs-user and team storage clearly distinguished.
- [x] Record approval in PRODUCT.md, root AGENTS and docs/PRICING.md; update landing/design docs. These are plan specifications, not implemented storage/security guarantees. Do not invent VAT, annual billing, free trials, certificate names, algorithms or extra quotas.
- [x] Run full `npm run check`, inspect both themes on desktop/tablet/mobile, and review source/spec. Store actual evidence; no publication.
