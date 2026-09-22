"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteGuest(guestId: string) {
  // Проверяем, что пользователь действительно вошёл в админку
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return {
      success: false,
      error: "Нет доступа",
    };
  }

  // Удаляем запись через серверный Admin-клиент
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from("guests")
    .delete()
    .eq("id", guestId);

  if (error) {
    console.error("DELETE GUEST ERROR:", JSON.stringify(error, null, 2));

    return {
      success: false,
      error: error.message || "Не удалось удалить запись",
    };
  }

  revalidatePath("/admin");

  return {
    success: true,
  };
}