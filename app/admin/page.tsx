export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import DeleteGuestButton from "./DeleteGuestButton";
import AdminRealtime from "./AdminRealtime";
export default async function AdminPage() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/admin/login");
  }

  const adminSupabase = createAdminClient();

  // Получаем гостей
  const { data: guests, error } = await adminSupabase
    .from("guests")
    .select(`
      id,
      name,
      attending,
      alcohol,
      custom_alcohol
    `)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(
      "GUESTS ERROR:",
      JSON.stringify(error, null, 2)
    );
  }

  // Получаем забронированные подарки
  const { data: selections, error: selectionsError } =
    await adminSupabase
      .from("gift_selections")
      .select(`
        guest_id
      `);

  if (selectionsError) {
    console.error(
      "GIFTS ERROR:",
      JSON.stringify(selectionsError, null, 2)
    );
  }

  const giftByGuest: Record<string, boolean> = {};

  selections?.forEach((selection: any) => {
    if (selection.guest_id) {
      giftByGuest[selection.guest_id] = true;
    }
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f1ed",
        color: "#24171b",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <AdminRealtime />
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* Заголовок */}
        <div style={{ marginBottom: "35px" }}>
          <div
            style={{
              fontSize: "12px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              opacity: 0.55,
              marginBottom: "10px",
            }}
          >
            Birthday evening
          </div>

          <h1
            style={{
              fontSize: "42px",
              margin: 0,
            }}
          >
            Админ-панель
          </h1>

          <p
            style={{
              opacity: 0.65,
              marginTop: "10px",
            }}
          >
            Гости · напитки · подарки
          </p>
        </div>

        {/* Таблица */}
        <div
          style={{
            background: "white",
            borderRadius: "22px",
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              padding: "25px",
              borderBottom: "1px solid #eee",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "24px",
              }}
            >
              Ответы гостей
            </h2>

            <p
              style={{
                margin: "8px 0 0",
                opacity: 0.55,
              }}
            >
              Всего ответов: {guests?.length || 0}
            </p>
          </div>

          {!guests || guests.length === 0 ? (
            <div
              style={{
                padding: "40px 25px",
                textAlign: "center",
                opacity: 0.6,
              }}
            >
              Пока никто не подтвердил участие.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "800px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#4b101f",
                      color: "white",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "16px" }}>
                      Имя
                    </th>

                    <th style={{ padding: "16px" }}>
                      Присутствие
                    </th>

                    <th style={{ padding: "16px" }}>
                      Напиток
                    </th>

                    <th style={{ padding: "16px" }}>
                      Забронированный подарок
                    </th>

                    <th style={{ padding: "16px" }}>
                      Действие
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {guests.map((guest: any) => {
                    let drink = guest.alcohol || "—";

if (guest.custom_alcohol?.trim()) {
  drink = guest.custom_alcohol;
}

                    const giftReserved =
                      Boolean(giftByGuest[guest.id]);

                    return (
                      <tr
                        key={guest.id}
                        style={{
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        {/* ИМЯ */}
                        <td
                          style={{
                            padding: "18px 16px",
                            fontWeight: 600,
                          }}
                        >
                          {guest.name}
                        </td>

                        {/* ПРИСУТСТВИЕ */}
                        <td
                          style={{
                            padding: "18px 16px",
                          }}
                        >
                          {guest.attending === "да"
                            ? "✓ Да"
                            : "✕ Нет"}
                        </td>

                        {/* НАПИТОК */}
                        <td
                          style={{
                            padding: "18px 16px",
                          }}
                        >
                          {drink}
                        </td>

                        {/* ПОДАРОК */}
                        <td
                          style={{
                            padding: "18px 16px",
                            fontWeight: 500,
                          }}
                        >
                          {giftReserved
                            ? "Забронировано"
                            : "Не забронировано"}
                        </td>

                        {/* УДАЛЕНИЕ */}
                        <td
                          style={{
                            padding: "18px 16px",
                          }}
                        >
                          <DeleteGuestButton
                            guestId={guest.id}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}