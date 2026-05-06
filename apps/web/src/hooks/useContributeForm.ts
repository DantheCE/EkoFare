import { useState } from "react";
import { submitContribution } from "../api/axios";
import type { VehicleType } from "@ekofare/types";

export interface StopRow {
  name: string;
  fare: string; // string so controlled input works cleanly; empty == "0"
}

export function useContributeForm() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [vehicle, setVehicle] = useState<VehicleType>("danfo");
  const [stops, setStops] = useState<StopRow[]>([
    { name: "", fare: "" }, // index 0 = origin (no fare)
  ]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Derived state ──────────────────────────────────────────────────────────

  const estimatedTotal = stops
    .slice(1)
    .reduce((sum, s) => sum + (Number(s.fare) || 0), 0);

  const stopCount = stops.length;

  // ── Stop list mutations ────────────────────────────────────────────────────

  function addStop() {
    setStops((prev) => [...prev, { name: "", fare: "" }]);
  }

  function removeStop(index: number) {
    setStops((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStop(index: number, field: keyof StopRow, value: string) {
    setStops((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  // ── Submission ─────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        route_name: `${from} → ${to}`,
        vehicle,
        stops_data: stops.map((s, i) => ({
          name: s.name,
          fare_from_previous: i === 0 ? 0 : Number(s.fare) || 0,
        })),
        notes: notes.trim() || undefined,
      };
      await submitContribution(payload);
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setFrom("");
    setTo("");
    setVehicle("danfo");
    setStops([{ name: "", fare: "" }]);
    setNotes("");
    setSuccess(false);
  }

  return {
    from, setFrom,
    to, setTo,
    vehicle, setVehicle,
    stops, addStop, removeStop, updateStop,
    notes, setNotes,
    submitting,
    success,
    estimatedTotal,
    stopCount,
    handleSubmit,
    reset,
  };
}
