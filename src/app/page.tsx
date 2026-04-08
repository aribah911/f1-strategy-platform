import Link from "@/components/Link";
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/auth/LogoutButton";
import PredictionBuilder from "@/components/landing/PredictionBuilder";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0a0a0a", color: "white" }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: "transparent" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight={700}>
            F1 Strategy Platform
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            {user ? (
              <>
                <Typography variant="body2" sx={{ color: "white", opacity: 0.85 }}>
                  {user.email}
                </Typography>

                <Button component={Link} href="/dashboard" color="inherit">
                  Dashboard
                </Button>

                <LogoutButton />
              </>
            ) : (
              <>
                <Button component={Link} href="/login" color="inherit">
                  Log in
                </Button>
                <Button component={Link} href="/signup" variant="contained">
                  Sign up
                </Button>
              </>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Stack spacing={6}>
          <Stack spacing={2} sx={{ maxWidth: 760 }}>
            <Typography variant="h3" fontWeight={700}>
              Build and test F1 lap predictions
            </Typography>

            <Typography variant="h6" sx={{ color: "grey.400" }}>
              Use historical race data to understand how season, tyre choice,
              weather, and track conditions can impact lap time.
            </Typography>
          </Stack>

          <PredictionBuilder  isLoggedIn={!!user} />
        </Stack>
      </Container>
    </Box>
  );
}