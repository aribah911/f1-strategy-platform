import Link from "@/components/Link";
import { redirect } from "next/navigation";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/auth/LogoutButton";
import DeletePredictionButton from "@/components/dashboard/DeletePredictionButton";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
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
      predictedLapTimeSeconds: true,
      createdAt: true,
    },
  });

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Dashboard
            </Typography>
            <Typography color="text.secondary">
              Welcome, {user.email}
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button component={Link} href="/" variant="contained">
              New Strategy
            </Button>
            <LogoutButton />
          </Stack>
        </Stack>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={700}>
              Saved Predictions
            </Typography>

            {predictions.length === 0 ? (
              <Stack spacing={2}>
                <Typography color="text.secondary">
                  You do not have any saved predictions yet.
                </Typography>

                <Button component={Link} href="/" variant="outlined" sx={{ alignSelf: "flex-start" }}>
                  Create Your First Strategy
                </Button>
              </Stack>
            ) : (
              predictions.map((prediction) => (
                <Paper key={prediction.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1.5}>
                    <Typography fontWeight={700}>
                      {prediction.name || "Untitled Prediction"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {prediction.year ?? "Unknown Year"} · {prediction.trackName} ·{" "}
                      {prediction.sessionType} · {prediction.tireCompound} ·{" "}
                      {prediction.trackCondition}
                    </Typography>

                    <Typography>
                      Predicted Lap: {prediction.predictedLapTimeSeconds.toFixed(3)}s
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Saved on {new Date(prediction.createdAt).toLocaleString()}
                    </Typography>

                    <Stack direction="row" spacing={1}>
                      <Button
                        component={Link}
                        href={`/predictions/${prediction.id}`}
                        variant="outlined"
                        size="small"
                      >
                        View
                      </Button>

                      <DeletePredictionButton predictionId={prediction.id} />
                    </Stack>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}