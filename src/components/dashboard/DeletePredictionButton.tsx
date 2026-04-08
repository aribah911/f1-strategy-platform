"use client";

import { useRouter } from "next/navigation";
import { Button } from "@mui/material";
import { useState } from "react";

type Props = {
  predictionId: string;
};

export default function DeletePredictionButton({ predictionId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this saved prediction?"
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/predictions/${predictionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete prediction.");
      }

      router.refresh();
    } catch {
      alert("Failed to delete prediction.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outlined"
      color="error"
      size="small"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? "Deleting..." : "Delete"}
    </Button>
  );
}