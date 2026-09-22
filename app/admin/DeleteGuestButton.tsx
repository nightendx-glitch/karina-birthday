"use client";

import { useState } from "react";
import { deleteGuest } from "./action";

export default function DeleteGuestButton({
  guestId,
}: {
  guestId: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Вы действительно хотите удалить эту запись?"
    );

    if (!confirmed) return;

    setLoading(true);

    const result = await deleteGuest(guestId);

    if (!result.success) {
      alert(result.error || "Не удалось удалить запись.");
    }

    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      style={{
        border: "none",
        background: "#f3e5e8",
        color: "#4b101f",
        padding: "10px 14px",
        borderRadius: "10px",
        cursor: loading ? "default" : "pointer",
        fontSize: "13px",
        fontWeight: 600,
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? "Удаление..." : "🗑 Удалить"}
    </button>
  );
}