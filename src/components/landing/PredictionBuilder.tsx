"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type {
  PredictLapRequest,
  Season,
  SessionType,
  TireCompound,
  TrackCondition,
  WeatherMode,
  WeatherPreset,
} from "@/types/prediction";

type TrackOption = {
  meetingKey: number;
  label: string;
  season: Season;
};

const TRACK_OPTIONS: TrackOption[] = [
  { meetingKey: 2025001, label: "Bahrain Grand Prix", season: 2025 },
  { meetingKey: 2025002, label: "Saudi Arabian Grand Prix", season: 2025 },
  { meetingKey: 2025003, label: "Australian Grand Prix", season: 2025 },
  { meetingKey: 2024001, label: "Bahrain Grand Prix", season: 2024 },
  { meetingKey: 2024002, label: "Saudi Arabian Grand Prix", season: 2024 },
  { meetingKey: 2023001, label: "Bahrain Grand Prix", season: 2023 },
];

const SEASON_OPTIONS: Season[] = [2023, 2024, 2025, 2026];
const SESSION_OPTIONS: SessionType[] = ["Qualifying", "Race"];
const TIRE_OPTIONS: TireCompound[] = ["SOFT", "MEDIUM", "HARD"];
const TRACK_CONDITION_OPTIONS: TrackCondition[] = [
  "DRY",
  "COOL",
  "HOT",
  "DAMP",
  "WET",
];
const WEATHER_MODE_OPTIONS: WeatherMode[] = ["PRESET", "MANUAL"];
const WEATHER_PRESET_OPTIONS: WeatherPreset[] = ["COOL", "NORMAL", "HOT", "WET"];

const DEFAULT_FORM: PredictLapRequest = {
  season: 2025,
  meetingKey: 2025001,
  sessionType: "Qualifying",
  tireCompound: "SOFT",
  trackCondition: "DRY",
  weatherMode: "PRESET",
  weatherPreset: "NORMAL",
  airTemperature: undefined,
  trackTemperature: undefined,
  humidity: undefined,
  rainfall: undefined,
  windSpeed: undefined,
};

export default function PredictionBuilder() {
  const [form, setForm] = useState<PredictLapRequest>(DEFAULT_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const availableTracks = useMemo(() => {
    return TRACK_OPTIONS.filter((track) => track.season === form.season);
  }, [form.season]);

  function updateField<K extends keyof PredictLapRequest>(
    key: K,
    value: PredictLapRequest[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleSeasonChange(season: Season) {
    const nextTracks = TRACK_OPTIONS.filter((track) => track.season === season);

    setForm((prev) => ({
      ...prev,
      season,
      meetingKey: nextTracks[0]?.meetingKey ?? 0,
    }));
  }

  function handleWeatherModeChange(mode: WeatherMode) {
    setForm((prev) => ({
      ...prev,
      weatherMode: mode,
      weatherPreset: mode === "PRESET" ? prev.weatherPreset ?? "NORMAL" : undefined,
      airTemperature: mode === "MANUAL" ? prev.airTemperature : undefined,
      trackTemperature: mode === "MANUAL" ? prev.trackTemperature : undefined,
      humidity: mode === "MANUAL" ? prev.humidity : undefined,
      rainfall: mode === "MANUAL" ? prev.rainfall : undefined,
      windSpeed: mode === "MANUAL" ? prev.windSpeed : undefined,
    }));
  }

  function validateForm() {
    if (!form.season) {
      return "Season is required.";
    }

    if (!form.meetingKey) {
      return "Track is required.";
    }

    if (form.weatherMode === "PRESET" && !form.weatherPreset) {
      return "Weather preset is required.";
    }

    if (form.weatherMode === "MANUAL") {
      const manualFields = [
        form.airTemperature,
        form.trackTemperature,
        form.humidity,
        form.rainfall,
        form.windSpeed,
      ];

      const hasMissingValue = manualFields.some(
        (value) => value === undefined || Number.isNaN(value)
      );

      if (hasMissingValue) {
        return "All manual weather fields are required.";
      }
    }

    return "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();
    setError(validationError);

    if (validationError) {
      return;
    }

    setLoading(true);

    try {
      console.log("Prediction form payload:", form);

      await new Promise((resolve) => setTimeout(resolve, 700));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper sx={{ p: 4, borderRadius: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Build a lap prediction
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Choose a season, track, session, tyre, and conditions to estimate lap
            performance.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Season"
                value={form.season}
                onChange={(event) =>
                  handleSeasonChange(Number(event.target.value) as Season)
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
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Track"
                value={form.meetingKey}
                onChange={(event) =>
                  updateField("meetingKey", Number(event.target.value))
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
                  <MenuItem value={0} disabled>
                    No tracks available for this season yet
                  </MenuItem>
                )}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Session Type"
                value={form.sessionType}
                onChange={(event) =>
                  updateField("sessionType", event.target.value as SessionType)
                }
                select
                fullWidth
              >
                {SESSION_OPTIONS.map((sessionType) => (
                  <MenuItem key={sessionType} value={sessionType}>
                    {sessionType}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Tire Compound"
                value={form.tireCompound}
                onChange={(event) =>
                  updateField("tireCompound", event.target.value as TireCompound)
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
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Track Condition"
                value={form.trackCondition}
                onChange={(event) =>
                  updateField(
                    "trackCondition",
                    event.target.value as TrackCondition
                  )
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
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Weather Mode"
                value={form.weatherMode}
                onChange={(event) =>
                  handleWeatherModeChange(event.target.value as WeatherMode)
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
            </Grid>

            {form.weatherMode === "PRESET" ? (
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Weather Preset"
                  value={form.weatherPreset ?? ""}
                  onChange={(event) =>
                    updateField(
                      "weatherPreset",
                      event.target.value as WeatherPreset
                    )
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
              </Grid>
            ) : (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Air Temperature (°C)"
                    type="number"
                    value={form.airTemperature ?? ""}
                    onChange={(event) =>
                      updateField(
                        "airTemperature",
                        event.target.value === ""
                          ? undefined
                          : Number(event.target.value)
                      )
                    }
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Track Temperature (°C)"
                    type="number"
                    value={form.trackTemperature ?? ""}
                    onChange={(event) =>
                      updateField(
                        "trackTemperature",
                        event.target.value === ""
                          ? undefined
                          : Number(event.target.value)
                      )
                    }
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Humidity (%)"
                    type="number"
                    value={form.humidity ?? ""}
                    onChange={(event) =>
                      updateField(
                        "humidity",
                        event.target.value === ""
                          ? undefined
                          : Number(event.target.value)
                      )
                    }
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Rainfall (mm)"
                    type="number"
                    value={form.rainfall ?? ""}
                    onChange={(event) =>
                      updateField(
                        "rainfall",
                        event.target.value === ""
                          ? undefined
                          : Number(event.target.value)
                      )
                    }
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Wind Speed (m/s)"
                    type="number"
                    value={form.windSpeed ?? ""}
                    onChange={(event) =>
                      updateField(
                        "windSpeed",
                        event.target.value === ""
                          ? undefined
                          : Number(event.target.value)
                      )
                    }
                    fullWidth
                  />
                </Grid>
              </>
            )}

            <Grid size={{ xs: 12 }}>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? "Running Prediction..." : "Run Prediction"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </Paper>
  );
}