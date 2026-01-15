
export interface Behavior {
  id: string;
  name: string;
  isCognitive: boolean; // Table 2 only includes Cognitive Domain (พุทธพิสัย)
}

export interface Unit {
  id: string;
  name: string;
  periods: number;
}

export interface CurriculumMetadata {
  code: string;
  subject: string;
  credits: string;
  level: string;
  branch: string;
}

export type MatrixData = Record<string, Record<string, number>>;
