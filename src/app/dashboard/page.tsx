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
import LogoutButton from "@/components/auth/LogoutButton";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0a0a0a", py: 8 }}>
      <Container maxWidth="md">
        <Stack spacing={4}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography variant="h4" fontWeight={700} color="white">
                Dashboard
              </Typography>
              <Typography sx={{ color: "grey.400", mt: 1 }}>
                Welcome, {user.email}
              </Typography>
            </Box>

            <LogoutButton />
          </Stack>

          <Paper sx={{ p: 4 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Race Strategies
                </Typography>
                <Typography color="text.secondary">
                  Create a new lap prediction or view your saved strategies.
                </Typography>
              </Box>

              <Button component={Link} href="/" variant="contained">
                New Strategy
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 4 }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={600}>
                Saved Predictions
              </Typography>

              <Typography color="text.secondary">
                You do not have any saved predictions yet.
              </Typography>

              <Button
                component={Link}
                href="/"
                variant="outlined"
                sx={{ width: "fit-content" }}
              >
                Create Your First Strategy
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}