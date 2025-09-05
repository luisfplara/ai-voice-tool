"use client";
import { Chip } from "@mui/material";

export type DriverStatus = "Driving" | "Delayed" | "Arrived" | "Unloading" | "Not Joined" | "Emergency";

export function CallStatusChip({ status }: { status: DriverStatus }) {
  return (
    <Chip
      label={status}
      color={
        status === "Driving"
          ? "info"
          : status === "Delayed"
          ? "warning"
          : status === "Arrived"
          ? "success"
          : status === "Not Joined"
          ? "default"
          : status === "Unloading"
          ? "success"
          : "error"
      }
    />
  );
}


