import { LegalDocument } from './LegalDocument';
import { COOKIES_SECTIONS } from './cookies.content';

export const Cookies = () => (
  <LegalDocument
    eyebrow="Legal"
    title="Cookie Policy"
    summary="Everything the app stores in your browser, what others set when you play a video or pay, and how to control it."
    sections={COOKIES_SECTIONS}
  />
);
