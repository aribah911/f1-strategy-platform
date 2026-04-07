import { NextRequest, NextResponse } from "next/server";
import { getSessionsByMeeting } from "@/lib/openf1";

const SUPPORTED_SESSION_TYPES = new Set(["Qualifying", "Race"]);

export async function GET(request: NextRequest) {
  try {
    const meetingKeyParam = request.nextUrl.searchParams.get("meetingKey");
    const meetingKey = Number(meetingKeyParam);

    if (!meetingKeyParam || Number.isNaN(meetingKey)) {
      return NextResponse.json(
        { error: "Valid meetingKey is required." },
        { status: 400 }
      );
    }

    const sessions = await getSessionsByMeeting(meetingKey);

    const supportedSessions = sessions
      .filter((session) => SUPPORTED_SESSION_TYPES.has(session.session_type))
      .map((session) => ({
        sessionKey: session.session_key,
        meetingKey: session.meeting_key,
        sessionName: session.session_name,
        sessionType: session.session_type,
      }));

    return NextResponse.json(supportedSessions);
  } catch (error) {
    console.error("GET /api/sessions failed", error);

    return NextResponse.json(
      { error: "Failed to load sessions." },
      { status: 500 }
    );
  }
}