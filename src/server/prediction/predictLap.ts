import type {
  PredictLapRequest,
  PredictLapResponse,
  RegulationBucket,
  SessionType,
  TireCompound,
} from "@/types/prediction";
import type { OpenF1Lap, OpenF1Stint, OpenF1Weather } from "@/lib/openf1";

type JoinedLap = {
  driverNumber: number;
  lapNumber: number;
  lapDuration: number;
  compound: TireCompound | null;
};

function getRegulationBucket(season: number): RegulationBucket {
  return season >= 2026 ? "REG_2026_PLUS" : "REG_2023_2025";
}

function median(values: number[]) {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((sorted.length - 1) * p);

  return sorted[index];
}

function formatLapTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds - minutes * 60;

  return `${minutes}:${remainingSeconds.toFixed(3).padStart(6, "0")}`;
}

function normalizeCompound(compound: string | null): TireCompound | null {
  if (!compound) return null;

  const value = compound.toUpperCase();

  if (value === "SOFT" || value === "MEDIUM" || value === "HARD") {
    return value;
  }

  return null;
}

function assignCompoundToLap(
  lap: OpenF1Lap,
  stints: OpenF1Stint[]
): TireCompound | null {
  const matchingStint = stints.find(
    (stint) =>
      stint.driver_number === lap.driver_number &&
      stint.lap_start != null &&
      stint.lap_end != null &&
      lap.lap_number >= stint.lap_start &&
      lap.lap_number <= stint.lap_end
  );

  return normalizeCompound(matchingStint?.compound ?? null);
}

function cleanAndJoinLaps(
  laps: OpenF1Lap[],
  stints: OpenF1Stint[],
  sessionType: SessionType,
  tireCompound: TireCompound
): JoinedLap[] {
  let baseLaps = laps
    .filter((lap) => lap.lap_duration != null)
    .filter((lap) => lap.is_pit_out_lap !== true)
    .map((lap) => ({
      driverNumber: lap.driver_number,
      lapNumber: lap.lap_number,
      lapDuration: lap.lap_duration as number,
      compound: assignCompoundToLap(lap, stints),
    }));

//   baseLaps = baseLaps.filter((lap) => lap.compound === tireCompound);

  if (baseLaps.length === 0) {
    return [];
  }

  if (sessionType === "Qualifying") {
    const fastestLap = Math.min(...baseLaps.map((lap) => lap.lapDuration));

    return baseLaps.filter((lap) => lap.lapDuration <= fastestLap + 5);
  }

  const durations = baseLaps.map((lap) => lap.lapDuration);
  const sessionMedian = median(durations);

  if (sessionMedian == null) {
    return [];
  }

  return baseLaps.filter(
    (lap) =>
      lap.lapDuration >= sessionMedian - 3 &&
      lap.lapDuration <= sessionMedian + 7
  );
}

function getWeatherMedians(weather: OpenF1Weather[]) {
  const air = weather.map((w) => w.air_temperature).filter((v): v is number => v != null);
  const track = weather.map((w) => w.track_temperature).filter((v): v is number => v != null);
  const humidity = weather.map((w) => w.humidity).filter((v): v is number => v != null);
  const rainfall = weather.map((w) => w.rainfall).filter((v): v is number => v != null);
  const wind = weather.map((w) => w.wind_speed).filter((v): v is number => v != null);

  return {
    airTemperature: median(air) ?? 0,
    trackTemperature: median(track) ?? 0,
    humidity: median(humidity) ?? 0,
    rainfall: median(rainfall) ?? 0,
    windSpeed: median(wind) ?? 0,
  };
}

function getPresetWeatherValues(preset: PredictLapRequest["weatherPreset"]) {
  switch (preset) {
    case "COOL":
      return {
        airTemperature: 18,
        trackTemperature: 24,
        humidity: 50,
        rainfall: 0,
        windSpeed: 10,
      };
    case "HOT":
      return {
        airTemperature: 31,
        trackTemperature: 42,
        humidity: 40,
        rainfall: 0,
        windSpeed: 8,
      };
    case "WET":
      return {
        airTemperature: 20,
        trackTemperature: 22,
        humidity: 85,
        rainfall: 2,
        windSpeed: 14,
      };
    case "NORMAL":
    default:
      return {
        airTemperature: 24,
        trackTemperature: 31,
        humidity: 55,
        rainfall: 0,
        windSpeed: 10,
      };
  }
}

function getTrackConditionPenalty(trackCondition: PredictLapRequest["trackCondition"]) {
  switch (trackCondition) {
    case "COOL":
      return -0.12;
    case "HOT":
      return 0.28;
    case "DAMP":
      return 4.5;
    case "WET":
      return 9.0;
    case "DRY":
    default:
      return 0;
  }
}

function getWeatherAdjustment(
  input: PredictLapRequest,
  historical: ReturnType<typeof getWeatherMedians>
) {
  const selected =
    input.weatherMode === "MANUAL"
      ? {
          airTemperature: input.airTemperature ?? historical.airTemperature,
          trackTemperature: input.trackTemperature ?? historical.trackTemperature,
          humidity: input.humidity ?? historical.humidity,
          rainfall: input.rainfall ?? historical.rainfall,
          windSpeed: input.windSpeed ?? historical.windSpeed,
        }
      : getPresetWeatherValues(input.weatherPreset);

  const airDelta = selected.airTemperature - historical.airTemperature;
  const trackDelta = selected.trackTemperature - historical.trackTemperature;
  const humidityDelta = selected.humidity - historical.humidity;
  const rainfallDelta = selected.rainfall - historical.rainfall;
  const windDelta = selected.windSpeed - historical.windSpeed;

  let adjustment = 0;
  adjustment += airDelta * 0.015;
  adjustment += trackDelta * 0.02;
  adjustment += humidityDelta * 0.003;
  adjustment += windDelta * 0.01;

  if (rainfallDelta > 0) {
    adjustment += Math.min(6, rainfallDelta * 1.5);
  }

  return adjustment;
}

export function buildPrediction(params: {
  input: PredictLapRequest;
  sessionKey: number;
  laps: OpenF1Lap[];
  stints: OpenF1Stint[];
  weather: OpenF1Weather[];
}): PredictLapResponse {
  const { input, sessionKey, laps, stints, weather } = params;

//   console.log("RAW LAPS COUNT:", laps.length);

//   console.log(
//     "RAW LAP SAMPLE:",
//     laps.slice(0, 10).map((lap) => ({
//       driver: lap.driver_number,
//       lap: lap.lap_number,
//       duration: lap.lap_duration,
//       pitOut: lap.is_pit_out_lap,
//     }))
//   );

//   console.log("RAW STINTS SAMPLE:", stints.slice(0, 50));

  const joinedLaps = cleanAndJoinLaps(
    laps, 
    stints, 
    input.sessionType, 
    input.tireCompound
  );

  console.log("CLEANED LAPS COUNT:", joinedLaps.length);

  console.log(
    "CLEANED LAP SAMPLE:",
    joinedLaps.slice(0, 10)
  );

  const compoundCounts = joinedLaps.reduce((acc, lap) => {
  acc[lap.compound ?? "UNKNOWN"] =
    (acc[lap.compound ?? "UNKNOWN"] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log("COMPOUND COUNTS:", compoundCounts);

  const compoundLaps = joinedLaps.filter(
    (lap) => lap.compound === input.tireCompound
  );

  console.log(
  "SELECTED COMPOUND:",
  input.tireCompound
);

console.log(
  "COMPOUND LAPS COUNT:",
  compoundLaps.length
);

console.log(
  "COMPOUND LAP TIMES:",
  compoundLaps.map((lap) => lap.lapDuration)
);

  const candidateLaps = compoundLaps.length > 0 ? compoundLaps : joinedLaps;
  const lapDurations = candidateLaps.map((lap) => lap.lapDuration);

  console.log(
  "USING COMPOUND LAPS?",
  compoundLaps.length > 0
);

console.log(
  "FINAL SAMPLE SIZE:",
  candidateLaps.length
);

  const base = median(lapDurations);

  if (base == null) {
    throw new Error("Not enough valid lap data to generate prediction.");
  }

  const historicalWeather = getWeatherMedians(weather);
  const weatherAdjustment = getWeatherAdjustment(input, historicalWeather);
  const trackConditionPenalty = getTrackConditionPenalty(input.trackCondition);

  const predicted = base + weatherAdjustment + trackConditionPenalty;
  const low = percentile(lapDurations, 0.2) ?? predicted - 0.35;
  const high = percentile(lapDurations, 0.8) ?? predicted + 0.35;

  const explanationParts = [
    `Baseline comes from historical ${input.sessionType.toLowerCase()} laps for this meeting on ${input.tireCompound.toLowerCase()} tyres.`,
  ];

  if (Math.abs(weatherAdjustment) > 0.05) {
    explanationParts.push(
      `Weather inputs changed the estimate by ${weatherAdjustment >= 0 ? "+" : ""}${weatherAdjustment.toFixed(2)}s versus the session median weather.`
    );
  }

  if (trackConditionPenalty !== 0) {
    explanationParts.push(
      `${input.trackCondition} track conditions added ${trackConditionPenalty >= 0 ? "+" : ""}${trackConditionPenalty.toFixed(2)}s.`
    );
  }

  return {
    predictedLapTimeSeconds: Number(predicted.toFixed(3)),
    predictedLapTimeFormatted: formatLapTime(predicted),
    lowSeconds: Number(low.toFixed(3)),
    highSeconds: Number(high.toFixed(3)),
    lowFormatted: formatLapTime(low),
    highFormatted: formatLapTime(high),
    explanation: explanationParts.join(" "),
    metadata: {
      season: input.season,
      regulationBucket: getRegulationBucket(input.season),
      meetingKey: input.meetingKey,
      sessionKey,
      sampleLapCount: lapDurations.length,
      baselineCompound: input.tireCompound,
      modelVersion: "v1-baseline-openf1",
    },
  };
}