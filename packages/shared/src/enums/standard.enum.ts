export enum StandardGroup {
  CLASSES = 'classes',
  COMPETITIVE_EXAMS = 'competitive exams',
  POST_GRADUATE_COMPETITIVE_EXAMS = 'post graduate competitive exams',
  GATE = 'gate',
  GENERAL = 'general',
  /** The HBCSE olympiad pathways (INPhO, INAO, ...) and their international finals. */
  OLYMPIADS = 'olympiads',
  /** Degree programmes: B.Sc. Physics and the like. */
  UNDERGRADUATE = 'undergraduate',
  /** Degree programmes: M.Sc. Physics and the like. Entrances stay in POST_GRADUATE_COMPETITIVE_EXAMS. */
  POST_GRADUATE = 'post graduate',
  /** Self-paced levelled tracks independent of any degree or exam — one standard per level. */
  LEARNING_TRACKS = 'learning tracks',
  /** Language tracks: one standard per language (Spanish, Sanskrit, ...), its levels are the subjects. */
  LANGUAGES = 'languages',
}
