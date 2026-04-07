"use client";

import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import type {
  PredictLapRequest,
  PredictLapResponse,
  Season,
  SessionType,
  TireCompound,
  TrackCondition,
  WeatherMode,
  WeatherPreset,
} from "@/types/prediction";

type TrackOption = {
  meetingKey: number;
  meetingName: string;
  trackName: string;
  circuitKey: number;
  countryName: string;
  year: number;
  label: string;
};

type SessionOption = {
  sessionKey: number;
  meetingKey: number;
  sessionName: string;
  sessionType: SessionType;
};

const SEASON_OPTIONS: Season[] = [2023, 2024, 2025, 2026];
const TIRE_OPTIONS: TireCompound[] = ["SOFT", "MEDIUM", "HARD"];
const TRACK_CONDITION_OPTIONS: TrackCondition[] = [
  "DRY",
  "COOL",
  "HOT",
  "DAMP",
  "WET",
];
const WEATHER_MODE_OPTIONS: WeatherMode[] = ["PRESET", "MANUAL"];
const WEATHER_PRESET_OPTIONS: WeatherPreset[] = [
  "COOL",
  "NORMAL",
  "HOT",
  "WET",
];

const DEFAULT_FORM: PredictLapRequest = {
  season: 2025,
  meetingKey: 0,
  sessionType: "Qualifying",
  tireCompound: "SOFT",
  trackCondition: "DRY",
  weatherMode: "PRESET",
  weatherPreset: "NORMAL",
};

export default function PredictionBuilder() {
  const [form, setForm] = useState<PredictLapRequest>(DEFAULT_FORM);
  const [tracks, setTracks] = useState<TrackOption[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [result, setResult] = useState<PredictLapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof PredictLapRequest>(
    key: K,
    value: PredictLapRequest[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateForm() {
    if (!form.meetingKey) return "Please select a track.";
    if (!form.sessionType) return "Please select a session.";
    if (!form.tireCompound) return "Please select a tire compound.";
    if (!form.trackCondition) return "Please select a track condition.";

    if (form.weatherMode === "PRESET" && !form.weatherPreset) {
      return "Please select a weather preset.";
    }

    if (form.weatherMode === "MANUAL") {
      const values = [
        form.airTemperature,
        form.trackTemperature,
        form.humidity,
        form.rainfall,
        form.windSpeed,
      ];

      if (values.some((value) => value === undefined || Number.isNaN(value))) {
        return "Please fill out all manual weather fields.";
      }
    }

    return "";
  }

  useEffect(() => {
    async function loadTracks() {
      setTracksLoading(true);
      setError("");
      setTracks([]);
      setSessions([]);

      try {
        const response = await fetch(`/api/tracks?season=${form.season}`);
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || "Failed to load tracks.");
        }

        setTracks(json);

        setForm((prev) => ({
          ...prev,
          meetingKey: json[0]?.meetingKey ?? 0,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tracks.");
      } finally {
        setTracksLoading(false);
      }
    }

    loadTracks();
  }, [form.season]);

  useEffect(() => {
    async function loadSessions() {
      if (!form.meetingKey) {
        setSessions([]);
        return;
      }

      setSessionsLoading(true);
      setError("");
      setSessions([]);

      try {
        const response = await fetch(
          `/api/sessions?meetingKey=${form.meetingKey}`
        );
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || "Failed to load sessions.");
        }

        setSessions(json);

        const uniqueSessionTypes = [
          ...new Set(
            json.map((session: SessionOption) => session.sessionType)
          ),
        ] as SessionType[];

        if (!uniqueSessionTypes.includes(form.sessionType)) {
          setForm((prev) => ({
            ...prev,
            sessionType: uniqueSessionTypes[0] ?? "Qualifying",
          }));
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load sessions."
        );
      } finally {
        setSessionsLoading(false);
      }
    }

    loadSessions();
  }, [form.meetingKey, form.sessionType]);

  const availableTracks = useMemo(() => tracks, [tracks]);

  const availableSessions = useMemo(() => {
    return [
      ...new Set(sessions.map((session) => session.sessionType)),
    ] as SessionType[];
  }, [sessions]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Prediction failed.");
      }

      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Build Prediction</Typography>

          <TextField
            label="Season"
            value={form.season}
            onChange={(e) =>
              updateField("season", Number(e.target.value) as Season)
            }
            select
            fullWidth
          >
            {SEASON_OPTIONS.map((season) => (
              <MenuItem key={season} value={season}>
                {season}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Track"
            value={tracks.length > 0 && form.meetingKey ? form.meetingKey : ""}
            onChange={(e) =>
              updateField("meetingKey", Number(e.target.value))
            }
            select
            fullWidth
          >
            {availableTracks.length > 0 ? (
              availableTracks.map((track) => (
                <MenuItem key={track.meetingKey} value={track.meetingKey}>
                  {track.label}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>
                {tracksLoading ? "Loading tracks..." : "No tracks available"}
              </MenuItem>
            )}
          </TextField>

          <TextField
            label="Session"
            value={
              availableSessions.includes(form.sessionType)
                ? form.sessionType
                : ""
            }
            onChange={(e) =>
              updateField("sessionType", e.target.value as SessionType)
            }
            select
            fullWidth
          >
            {availableSessions.length > 0 ? (
              availableSessions.map((sessionType) => (
                <MenuItem key={sessionType} value={sessionType}>
                  {sessionType}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>
                {sessionsLoading ? "Loading sessions..." : "No sessions available"}
              </MenuItem>
            )}
          </TextField>

          <TextField
            label="Tire Compound"
            value={form.tireCompound}
            onChange={(e) =>
              updateField("tireCompound", e.target.value as TireCompound)
            }
            select
            fullWidth
          >
            {TIRE_OPTIONS.map((tire) => (
              <MenuItem key={tire} value={tire}>
                {tire}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Track Condition"
            value={form.trackCondition}
            onChange={(e) =>
              updateField("trackCondition", e.target.value as TrackCondition)
            }
            select
            fullWidth
          >
            {TRACK_CONDITION_OPTIONS.map((condition) => (
              <MenuItem key={condition} value={condition}>
                {condition}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Weather Mode"
            value={form.weatherMode}
            onChange={(e) =>
              updateField("weatherMode", e.target.value as WeatherMode)
            }
            select
            fullWidth
          >
            {WEATHER_MODE_OPTIONS.map((mode) => (
              <MenuItem key={mode} value={mode}>
                {mode}
              </MenuItem>
            ))}
          </TextField>

          {form.weatherMode === "PRESET" && (
            <TextField
              label="Weather Preset"
              value={form.weatherPreset ?? ""}
              onChange={(e) =>
                updateField("weatherPreset", e.target.value as WeatherPreset)
              }
              select
              fullWidth
            >
              {WEATHER_PRESET_OPTIONS.map((preset) => (
                <MenuItem key={preset} value={preset}>
                  {preset}
                </MenuItem>
              ))}
            </TextField>
          )}

          {form.weatherMode === "MANUAL" && (
            <>
              <TextField
                label="Air Temperature"
                type="number"
                value={form.airTemperature ?? ""}
                onChange={(e) =>
                  updateField(
                    "airTemperature",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                fullWidth
              />

              <TextField
                label="Track Temperature"
                type="number"
                value={form.trackTemperature ?? ""}
                onChange={(e) =>
                  updateField(
                    "trackTemperature",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                fullWidth
              />

              <TextField
                label="Humidity"
                type="number"
                value={form.humidity ?? ""}
                onChange={(e) =>
                  updateField(
                    "humidity",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                fullWidth
              />

              <TextField
                label="Rainfall"
                type="number"
                value={form.rainfall ?? ""}
                onChange={(e) =>
                  updateField(
                    "rainfall",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                fullWidth
              />

              <TextField
                label="Wind Speed"
                type="number"
                value={form.windSpeed ?? ""}
                onChange={(e) =>
                  updateField(
                    "windSpeed",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                fullWidth
              />
            </>
          )}

          {error ? <Typography color="error">{error}</Typography> : null}

          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Running..." : "Run Prediction"}
          </Button>
        </Stack>
      </Paper>

      {result ? (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Stack spacing={1}>
            <Typography variant="h6">Prediction Result</Typography>
            <Typography>
              Predicted Lap: {result.predictedLapTimeFormatted}
            </Typography>
            <Typography>
              Range: {result.lowFormatted} - {result.highFormatted}
            </Typography>
            <Typography>
              Sample Laps: {result.metadata.sampleLapCount}
            </Typography>
            <Typography>Explanation: {result.explanation}</Typography>
          </Stack>
        </Paper>
      ) : null}
    </Box>
  );
}