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

      <Container maxWidth="md" sx={{ py: 10 }}>
        <Stack spacing={3}>
          <Typography variant="h3" fontWeight={700}>
            Build and test F1 lap strategies
          </Typography>

          <Typography variant="h6" sx={{ color: "grey.400" }}>
            Build a simple F1 lap prediction using historical OpenF1 data.
          </Typography>

          <Button variant="contained" sx={{ width: "fit-content" }}>
            Start Building
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}