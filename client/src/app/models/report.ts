export interface SurvivalRate {
  total: number;
  monitored: number;
  alive: number;
  struggling: number;
  dead: number;
  unmonitored: number;
}

export interface SpeciesStat {
  id: number;
  common_name: string;
  scientific_name: string;
  total_planted: number;
  monitored: number;
  alive: number;
  struggling: number;
  dead: number;
}

export interface ZoneSummary {
  id: number;
  name: string;
  total_plantings: number;
  monitored: number;
  alive: number;
  struggling: number;
  dead: number;
}

export interface SurvivalReport {
  overall: SurvivalRate;
  bySpecies: SpeciesStat[];
  byZone: ZoneSummary[];
}

export interface EvolutionPoint {
  period: string;
  total: number;
}
