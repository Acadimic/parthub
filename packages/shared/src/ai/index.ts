// The AI generation core: prompt builders, reply parsers and validators, and the converters that
// turn a reply into the entity rows the bulk routes accept. Pure TypeScript with no browser or
// server dependency, so the teaching app, the terminal course agent and (later) a server-side job
// runner share one implementation.
export * from './common';
export * from './figures';
export * from './graphs';
export * from './scenes';
export * from './pronunciation';
export * from './defaults';
export * from './test-paper-generator';
export * from './test-paper-plan';
export * from './study-material-setup';
export * from './study-material-prompt';
export * from './study-material-generator';
export * from './course-generator';
export * from './course-modules';
export * from './course-review';
