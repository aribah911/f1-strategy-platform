import { NextRequest, NextResponse } from "next/server";
import type { PredictLapRequest } from "@/types/prediction";
import {
  getLapsBySession,
  getSessionsByMeeting,
  getStintsBySession,
  getWeatherBySession,
} from "@/lib/openf1";
import { buildPrediction } from "@/server/prediction/predictLap";

function validateRequest(input: PredictLapRequest) {
  if (!input.season) return "Season is required.";
  if (!input.meetingKey) return "Meeting key is required.";
  if (!input.sessionType) return "Session type is required.";
  if (!input.tireCompound) return "Tire compound is required.";
  if (!input.trackCondition) return "Track condition is required.";
  if (!input.weatherMode) return "Weather mode is required.";

  if (input.weatherMode === "PRESET" && !input.weatherPreset) {
    return "Weather preset is required.";
  }

  if (input.weatherMode === "MANUAL") {
    const manualFields = [
      input.airTemperature,
      input.trackTemperature,
      input.humidity,
      input.rainfall,
      input.windSpeed,
    ];

    const hasMissingValue = manualFields.some(
      (value) => value === undefined || Number.isNaN(value)
    );

    if (hasMissingValue) {
      return "All manual weather fields are required.";
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const input = (await request.json()) as PredictLapRequest;

    const validationError = validateRequest(input);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const sessions = await getSessionsByMeeting(input.meetingKey);
    const targetSession = sessions.find(
      (session) => session.session_type === input.sessionType
    );

    if (!targetSession) {
      return NextResponse.json(
        { error: "No matching session found for that meeting." },
        { status: 404 }
      );
    }

    const sessionKey = targetSession.session_key;

    const [laps, stints, weather] = await Promise.all([
      getLapsBySession(sessionKey),
      getStintsBySession(sessionKey),
      getWeatherBySession(sessionKey),
    ]);

    const result = buildPrediction({
      input,
      sessionKey,
      laps,
      stints,
      weather,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/predict failed", error);

    return NextResponse.json(
      { error: "Failed to generate prediction." },
      { status: 500 }
    );
  }
}