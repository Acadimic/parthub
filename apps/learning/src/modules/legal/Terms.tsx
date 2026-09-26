import { LegalDocument } from './LegalDocument';
import { TERMS_SECTIONS } from './terms.content';

export const Terms = () => (
  <LegalDocument
    eyebrow="Legal"
    title="Terms of Service"
    summary="The agreement between you and Acadimic for learning, teaching and publishing here, including how AI-assisted courses and third-party material are handled."
    sections={TERMS_SECTIONS}
  />
);
