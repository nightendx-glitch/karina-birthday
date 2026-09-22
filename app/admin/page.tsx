import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/admin/login");
  }

  const { data: guests, error } = await supabase
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
    console.error(error);
  }

  const { data: selections } = await supabase
    .from("gift_selections")
    .select(`
      guest_id,
      gifts (
        name
      )
    `);

  const giftByGuest: Record<string, string> = {};

  selections?.forEach((selection: any) => {
    if (selection.gifts?.name) {
      giftByGuest[selection.guest_id] = selection.gifts.name;
    }
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#dcccca",
        color: "#24171b",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
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

          {(!guests || guests.length === 0) ? (
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
                  minWidth: "700px",
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
                    <th style={{ padding: "16px" }}>Имя</th>
                    <th style={{ padding: "16px" }}>Присутствие</th>
                    <th style={{ padding: "16px" }}>Напиток</th>
                    <th style={{ padding: "16px" }}>
                      Забронированный подарок
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {guests.map((guest: any) => {
                    let drink = guest.alcohol || "—";

                    if (
                      guest.alcohol === "свой вариант" &&
                      guest.custom_alcohol
                    ) {
                      drink = guest.custom_alcohol;
                    }

                    const gift =
                      giftByGuest[guest.id] || "Подарок не выбран";

                    return (
                      <tr
                        key={guest.id}
                        style={{
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <td
                          style={{
                            padding: "18px 16px",
                            fontWeight: 600,
                          }}
                        >
                          {guest.name}
                        </td>

                        <td style={{ padding: "18px 16px" }}>
                          {guest.attending === "да"
                            ? "✓ Да"
                            : "✕ Нет"}
                        </td>

                        <td style={{ padding: "18px 16px" }}>
                          {drink}
                        </td>

                        <td
                          style={{
                            padding: "18px 16px",
                            fontWeight: 500,
                          }}
                        >
                          {gift}
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