"use client";

import {
  Alert,
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

type PredictionBuilderProps = {
  isLoggedIn: boolean;
};

type TrackOption = {
  meetingKey: number;
  trackName: string;
  label: string;
  circuitKey: number;
};

type SessionOption = {
  sessionKey: number;
  sessionType: SessionType;
};

const DEFAULT_FORM: PredictLapRequest = {
  season: 2025,
  meetingKey: 0,
  sessionType: "Qualifying",
  tireCompound: "SOFT",
  trackCondition: "DRY",
  weatherMode: "PRESET",
  weatherPreset: "NORMAL",
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

export default function PredictionBuilder({
  isLoggedIn,
}: PredictionBuilderProps) {
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState<PredictLapRequest>(DEFAULT_FORM);
  const [tracks, setTracks] = useState<TrackOption[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [result, setResult] = useState<PredictLapResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [error, setError] = useState("");

  const [saveLabel, setSaveLabel] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function updateField<K extends keyof PredictLapRequest>(
    key: K,
    value: PredictLapRequest[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    async function loadTracks() {
      setTracksLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/tracks?season=${form.season}`);
        const json = await res.json();

        if (!res.ok) {
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

      try {
        const res = await fetch(`/api/sessions?meetingKey=${form.meetingKey}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to load sessions.");
        }

        setSessions(json);

        const types = [
          ...new Set(json.map((s: SessionOption) => s.sessionType)),
        ] as SessionType[];

        setForm((prev) => ({
          ...prev,
          sessionType: types.includes(prev.sessionType)
            ? prev.sessionType
            : types[0] ?? prev.sessionType,
        }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load sessions."
        );
      } finally {
        setSessionsLoading(false);
      }
    }

    loadSessions();
  }, [form.meetingKey]);

  const availableSessions = useMemo(
    () => [...new Set(sessions.map((s) => s.sessionType))] as SessionType[],
    [sessions]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setResult(null);
    setError("");
    setSaveMessage("");
    setSaveError("");

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        body: JSON.stringify(form),
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Prediction failed.");
      }

      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!isLoggedIn) {
      setSaveError("You must be logged in.");
      return;
    }

    if (!result) return;

    const track = tracks.find((t) => t.meetingKey === form.meetingKey);

    setSaveLoading(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        body: JSON.stringify({
          name: saveLabel.trim() || null,
          meetingKey: form.meetingKey,
          sessionKey: result.metadata.sessionKey ?? null,
          year: form.season,
          trackName: track?.trackName ?? track?.label ?? "Unknown",
          circuitKey: track?.circuitKey ?? null,
          sessionType: form.sessionType,
          tireCompound: form.tireCompound,
          trackCondition: form.trackCondition,
          weatherMode: form.weatherMode,
          weatherPreset: form.weatherPreset ?? null,
          airTemperature: form.airTemperature ?? null,
          trackTemperature: form.trackTemperature ?? null,
          humidity: form.humidity ?? null,
          rainfall: form.rainfall ?? null,
          windSpeed: form.windSpeed ?? null,
          predictedLapTimeSeconds: result.predictedLapTimeSeconds,
          predictedLapTimeLow: result.lowSeconds,
          predictedLapTimeHigh: result.highSeconds,
          explanation: result.explanation,
          modelVersion: result.metadata.modelVersion,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to save prediction.");
      }

      setSaveMessage("Prediction saved.");
      setSaveLabel("");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save prediction."
      );
    } finally {
      setSaveLoading(false);
    }
  }

  if (!mounted) {
    return (
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          Build Prediction
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4 }}>
      <Stack component="form" spacing={3} onSubmit={handleSubmit}>
        <Typography variant="h5" fontWeight={700}>
          Build Prediction
        </Typography>

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
          value={form.meetingKey}
          onChange={(e) => updateField("meetingKey", Number(e.target.value))}
          select
          fullWidth
          disabled={tracksLoading || tracks.length === 0}
        >
          {tracks.length > 0 ? (
            tracks.map((track) => (
              <MenuItem key={track.meetingKey} value={track.meetingKey}>
                {track.label}
              </MenuItem>
            ))
          ) : (
            <MenuItem value={0}>
              {tracksLoading ? "Loading tracks..." : "No tracks available"}
            </MenuItem>
          )}
        </TextField>

        <TextField
          label="Session Type"
          value={form.sessionType}
          onChange={(e) =>
            updateField("sessionType", e.target.value as SessionType)
          }
          select
          fullWidth
          disabled={sessionsLoading || availableSessions.length === 0}
        >
          {availableSessions.length > 0 ? (
            availableSessions.map((sessionType) => (
              <MenuItem key={sessionType} value={sessionType}>
                {sessionType}
              </MenuItem>
            ))
          ) : (
            <MenuItem value="">
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

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? "Running..." : "Run Prediction"}
        </Button>

        {result ? (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                Prediction Result
              </Typography>

              <Typography>
                <strong>Predicted Lap:</strong> {result.predictedLapTimeFormatted}
              </Typography>

              <Typography>
                <strong>Range:</strong> {result.lowFormatted} - {result.highFormatted}
              </Typography>

              <Typography>
                <strong>Sample Laps:</strong> {result.metadata.sampleLapCount}
              </Typography>

              <Typography>
                <strong>Explanation:</strong> {result.explanation}
              </Typography>

              {isLoggedIn ? (
                <>
                  <TextField
                    label="Label"
                    value={saveLabel}
                    onChange={(e) => setSaveLabel(e.target.value)}
                    fullWidth
                  />

                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saveLoading}
                  >
                    {saveLoading ? "Saving..." : "Save Prediction"}
                  </Button>
                </>
              ) : (
                <Alert severity="info">
                  Log in to save predictions.
                </Alert>
              )}

              {saveMessage ? <Alert severity="success">{saveMessage}</Alert> : null}
              {saveError ? <Alert severity="error">{saveError}</Alert> : null}
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    </Paper>
  );
}