export type Season = 2023 | 2024 | 2025 | 2026;

export type SessionType = "Qualifying" | "Race";

export type TireCompound = "SOFT" | "MEDIUM" | "HARD";

export type TrackCondition = "DRY" | "COOL" | "HOT" | "DAMP" | "WET";

export type WeatherMode = "PRESET" | "MANUAL";

export type WeatherPreset = "COOL" | "NORMAL" | "HOT" | "WET";

export type RegulationBucket = "REG_2023_2025" | "REG_2026_PLUS";

export type PredictLapRequest = {
  season: Season;
  meetingKey: number;
  sessionType: SessionType;
  tireCompound: TireCompound;
  trackCondition: TrackCondition;
  weatherMode: WeatherMode;
  weatherPreset?: WeatherPreset;
  airTemperature?: number;
  trackTemperature?: number;
  humidity?: number;
  rainfall?: number;
  windSpeed?: number;
};

export type PredictLapResponse = {
  predictedLapTimeSeconds: number;
  predictedLapTimeFormatted: string;
  lowSeconds: number;
  highSeconds: number;
  lowFormatted: string;
  highFormatted: string;
  explanation: string;
  metadata: {
    season: Season;
    regulationBucket: RegulationBucket;
    meetingKey: number;
    sessionKey?: number;
    sampleLapCount: number;
    baselineCompound: TireCompound;
    modelVersion: string;
  };
};