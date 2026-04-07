const OPENF1_BASE_URL = "https://api.openf1.org/v1";

type OpenF1Meeting = {
  meeting_key: number;
  meeting_name: string;
  country_name: string;
  circuit_key: number;
  circuit_short_name: string;
  year: number;
};

type OpenF1Session = {
  session_key: number;
  meeting_key: number;
  session_name: string;
  session_type: string;
};

export type OpenF1Lap = {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  is_pit_out_lap: boolean;
};

export type OpenF1Stint = {
  driver_number: number;
  compound: string | null;
  lap_start: number | null;
  lap_end: number | null;
  tyre_age_at_start: number | null;
};

export type OpenF1Weather = {
  air_temperature: number | null;
  track_temperature: number | null;
  humidity: number | null;
  rainfall: number | null;
  wind_speed: number | null;
  date: string;
};

async function openF1Fetch<T>(
  path: string,
  options?: {
    revalidate?: number;
  }
): Promise<T> {
  const url = `${OPENF1_BASE_URL}${path}`;

  const response = await fetch(url, {
    next: {
      revalidate: options?.revalidate ?? 60 * 60,
    },
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`OpenF1 request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function getMeetingsByYear(year: number) {
  return openF1Fetch<OpenF1Meeting[]>(
    `/meetings?year=${year}`,
    { revalidate: 60 * 60 * 24 }
  );
}

export async function getSessionsByMeeting(meetingKey: number) {
  return openF1Fetch<OpenF1Session[]>(
    `/sessions?meeting_key=${meetingKey}`,
    { revalidate: 60 * 60 * 24 }
  );
}

export async function getLapsBySession(sessionKey: number) {
  return openF1Fetch<OpenF1Lap[]>(
    `/laps?session_key=${sessionKey}`,
    { revalidate: 60 * 60 * 6 }
  );
}

export async function getStintsBySession(sessionKey: number) {
  return openF1Fetch<OpenF1Stint[]>(
    `/stints?session_key=${sessionKey}`,
    { revalidate: 60 * 60 * 6 }
  );
}

export async function getWeatherBySession(sessionKey: number) {
  return openF1Fetch<OpenF1Weather[]>(
    `/weather?session_key=${sessionKey}`,
    { revalidate: 60 * 60 * 6 }
  );
}