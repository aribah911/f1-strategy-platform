import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const predictions = await prisma.prediction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      year: true,
      trackName: true,
      sessionType: true,
      tireCompound: true,
      trackCondition: true,
      weatherMode: true,
      weatherPreset: true,
      predictedLapTimeSeconds: true,
      predictedLapTimeLow: true,
      predictedLapTimeHigh: true,
      createdAt: true,
    },
  });

  return NextResponse.json(predictions);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.trackName || !body.sessionType || !body.tireCompound) {
    return NextResponse.json(
      { error: "Missing required prediction fields." },
      { status: 400 }
    );
  }

  const prediction = await prisma.prediction.create({
    data: {
      userId: user.id,
      name: body.name?.trim() || null,
      meetingKey: body.meetingKey,
      sessionKey: body.sessionKey ?? null,
      year: body.year ?? null,
      trackName: body.trackName,
      circuitKey: body.circuitKey ?? null,
      sessionType: body.sessionType,
      tireCompound: body.tireCompound,
      trackCondition: body.trackCondition,
      weatherMode: body.weatherMode,
      weatherPreset: body.weatherPreset ?? null,
      airTemperature: body.airTemperature ?? null,
      trackTemperature: body.trackTemperature ?? null,
      humidity: body.humidity ?? null,
      rainfall: body.rainfall ?? null,
      windSpeed: body.windSpeed ?? null,
      predictedLapTimeSeconds: body.predictedLapTimeSeconds,
      predictedLapTimeLow: body.predictedLapTimeLow,
      predictedLapTimeHigh: body.predictedLapTimeHigh,
      explanation: body.explanation,
      modelVersion: body.modelVersion,
    },
  });

  return NextResponse.json(prediction, { status: 201 });
}