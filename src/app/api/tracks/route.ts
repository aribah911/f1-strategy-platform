import { NextRequest, NextResponse } from "next/server";
import { getMeetingsByYear } from "@/lib/openf1";

export async function GET(request: NextRequest) {
  try {
    const seasonParam = request.nextUrl.searchParams.get("season");
    const season = Number(seasonParam);

    if (!seasonParam || Number.isNaN(season)) {
      return NextResponse.json(
        { error: "Valid season is required." },
        { status: 400 }
      );
    }

    const meetings = await getMeetingsByYear(season);

    const tracks = meetings
      .map((meeting) => ({
        meetingKey: meeting.meeting_key,
        meetingName: meeting.meeting_name,
        trackName: meeting.circuit_short_name,
        circuitKey: meeting.circuit_key,
        countryName: meeting.country_name,
        year: meeting.year,
        label: `${meeting.circuit_short_name} - ${meeting.meeting_name}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return NextResponse.json(tracks);
  } catch (error) {
    console.error("GET /api/tracks failed", error);

    return NextResponse.json(
      { error: "Failed to load tracks." },
      { status: 500 }
    );
  }
}