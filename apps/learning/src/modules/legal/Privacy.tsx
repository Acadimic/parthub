import { LegalDocument } from './LegalDocument';
import { PRIVACY_SECTIONS } from './privacy.content';

export const Privacy = () => (
  <LegalDocument
    eyebrow="Legal"
    title="Privacy Policy"
    summary="How we collect, use, share and protect personal data, and what you and your parents can ask of us."
    sections={PRIVACY_SECTIONS}
  />
);
