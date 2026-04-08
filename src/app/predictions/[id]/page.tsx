import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "@/components/Link";
import {
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PredictionDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const prediction = await prisma.prediction.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!prediction) {
    notFound();
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2}>
          <Button component={Link} href="/dashboard" variant="outlined">
            Back to Dashboard
          </Button>
          <Button component={Link} href="/" variant="contained">
            New Strategy
          </Button>
        </Stack>

        <Paper sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h4" fontWeight={700}>
              {prediction.name || "Untitled Prediction"}
            </Typography>

            <Typography>
              <strong>Track:</strong> {prediction.trackName}
            </Typography>

            <Typography>
              <strong>Season:</strong> {prediction.year ?? "Unknown"}
            </Typography>

            <Typography>
              <strong>Session:</strong> {prediction.sessionType}
            </Typography>

            <Typography>
              <strong>Tire Compound:</strong> {prediction.tireCompound}
            </Typography>

            <Typography>
              <strong>Track Condition:</strong> {prediction.trackCondition}
            </Typography>

            <Typography>
              <strong>Weather Mode:</strong> {prediction.weatherMode}
            </Typography>

            {prediction.weatherPreset ? (
              <Typography>
                <strong>Weather Preset:</strong> {prediction.weatherPreset}
              </Typography>
            ) : null}

            <Typography>
              <strong>Predicted Lap:</strong>{" "}
              {prediction.predictedLapTimeSeconds.toFixed(3)}s
            </Typography>

            <Typography>
              <strong>Range:</strong>{" "}
              {prediction.predictedLapTimeLow.toFixed(3)}s -{" "}
              {prediction.predictedLapTimeHigh.toFixed(3)}s
            </Typography>

            <Typography>
              <strong>Explanation:</strong> {prediction.explanation}
            </Typography>

            <Typography>
              <strong>Model Version:</strong> {prediction.modelVersion}
            </Typography>

            <Typography color="text.secondary" variant="body2">
              Saved on {new Date(prediction.createdAt).toLocaleString()}
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}