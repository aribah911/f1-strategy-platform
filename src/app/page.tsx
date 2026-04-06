import { Box, Button, Container, Stack, Typography } from "@mui/material";

export default function HomePage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0a0a0a", color: "white", py: 8 }}>
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Typography variant="h3" fontWeight={700}>
            F1 Strategy Platform
          </Typography>

          <Typography variant="h6" sx={{ color: "grey.400" }}>
            Build and test F1 lap strategies with historical data.
          </Typography>

          <Button variant="contained" sx={{ width: "fit-content" }}>
            Start Building
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}