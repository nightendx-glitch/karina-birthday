"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { supabase } from "@/lib/supabase";

type Gift = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  is_reserved: boolean;
};

const giftGroupInfo = [
  {
    number: "01",
    title: "Something beautiful",
    subtitle: "подарки, которые хочется сохранить",
  },
  {
    number: "02",
    title: "For cozy days",
    subtitle: "для тепла, красоты и уюта",
  },
  {
    number: "03",
    title: "Little wishes",
    subtitle: "маленькие желания",
  },
  {
    number: "04",
    title: "For the soul",
    subtitle: "приятные подарки без повода",
  },
];

export default function Home() {
  /* =========================
     RSVP
  ========================= */

  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no" | "">("");
  const [alcohol, setAlcohol] = useState("");
  const [customAlcohol, setCustomAlcohol] = useState("");

  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpError, setRsvpError] = useState("");

  const [guestId, setGuestId] = useState<string | null>(null);

  /* =========================
     GIFTS
  ========================= */

  const [gifts, setGifts] = useState<Gift[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(true);
  const [giftError, setGiftError] = useState("");

  const [reservingGiftId, setReservingGiftId] =
    useState<string | null>(null);

  const [myReservedGiftIds, setMyReservedGiftIds] =
    useState<string[]>([]);

  const [cancelingGiftId, setCancelingGiftId] =
    useState<string | null>(null);

  /* =========================
     LOAD MY RESERVED GIFTS
  ========================= */

  async function loadMyReservedGifts(currentGuestId: string) {
    const { data, error } = await supabase.rpc(
      "get_my_reserved_gifts",
      {
        p_guest_id: currentGuestId,
      }
    );

    if (error) {
      console.error(
        "MY RESERVED GIFTS ERROR:",
        error
      );
      return;
    }

    const ids = (data || []).map(
      (item: { gift_id: string }) => item.gift_id
    );

    setMyReservedGiftIds(ids);
  }

  /* =========================
     LOAD SAVED GUEST
  ========================= */

  useEffect(() => {
    const savedGuestId =
      localStorage.getItem("birthday_guest_id");

    if (savedGuestId) {
      setGuestId(savedGuestId);
      loadMyReservedGifts(savedGuestId);
    }
  }, []);

  /* =========================
     LOAD GIFTS
  ========================= */

  async function loadGifts() {
    setGiftsLoading(true);

    const { data, error } = await supabase
      .from("gifts")
      .select(
        "id, name, description, image_url, is_reserved"
      )
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "SUPABASE GIFTS ERROR:",
        error
      );

      setGiftError(
        `Ошибка загрузки подарков: ${
          error.message || "неизвестная ошибка"
        }`
      );
    } else {
      setGifts(data || []);
    }

    setGiftsLoading(false);
  }

  useEffect(() => {
    loadGifts();
  }, []);

  /* =========================
     REALTIME GIFTS
  ========================= */

 

useEffect(() => {
  const channel = supabase
    .channel("birthday-gifts-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "gifts",
      },
      () => {
        loadGifts();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  /* =========================
     RSVP
  ========================= */

  async function handleRsvp() {
    setRsvpError("");
    setRsvpSuccess(false);

    const cleanName = name.trim();

    if (!cleanName) {
      setRsvpError(
        "Пожалуйста, напишите своё имя."
      );
      return;
    }

    if (!attending) {
      setRsvpError(
        "Пожалуйста, выберите, будете ли вы."
      );
      return;
    }

    if (attending === "yes" && !alcohol) {
      setRsvpError(
        "Пожалуйста, выберите напиток."
      );
      return;
    }

    if (
      attending === "yes" &&
      alcohol === "Свой вариант" &&
      !customAlcohol.trim()
    ) {
      setRsvpError(
        "Напишите свой вариант напитка."
      );
      return;
    }

    setRsvpLoading(true);

    const newGuestId = crypto.randomUUID();

    const finalAlcohol =
      attending === "no"
        ? null
        : alcohol === "Свой вариант"
        ? "Свой вариант"
        : alcohol;

    const finalCustomAlcohol =
      attending === "yes" &&
      alcohol === "Свой вариант"
        ? customAlcohol.trim()
        : null;

    const { error } = await supabase
      .from("guests")
      .insert({
        id: newGuestId,
        name: cleanName,
        attending,
        alcohol: finalAlcohol,
        custom_alcohol: finalCustomAlcohol,
      });

    if (error) {
      console.error(
        "RSVP ERROR:",
        error
      );

      setRsvpError(
        "Не получилось сохранить ответ. Попробуйте ещё раз."
      );

      setRsvpLoading(false);
      return;
    }

    localStorage.setItem(
      "birthday_guest_id",
      newGuestId
    );

    setGuestId(newGuestId);

    setRsvpSuccess(true);
    setRsvpLoading(false);
  }

  /* =========================
   RESERVE GIFT
========================= */

async function reserveGift(
  giftId: string,
  event?: MouseEvent<HTMLButtonElement>
) {
  event?.preventDefault();
  event?.stopPropagation();

  setGiftError("");

  let currentGuestId = guestId;

  if (!currentGuestId) {
    currentGuestId =
      localStorage.getItem("birthday_guest_id");
  }

  if (!currentGuestId) {
    setGiftError(
      "Сначала подтвердите своё присутствие, а затем выберите подарок."
    );

    document
      .querySelector(".rsvp-section")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

    return;
  }

  setReservingGiftId(giftId);

  try {
    const { data, error } =
      await supabase.rpc("reserve_gift", {
        p_gift_id: giftId,
        p_guest_id: currentGuestId,
      });

    if (error) {
      console.error(
        "RESERVE GIFT ERROR:",
        error
      );

      setGiftError(
        `Не удалось забронировать подарок: ${error.message}`
      );

      return;
    }

    if (data === true) {
      /*
       * ВАЖНО:
       * Не загружаем все подарки заново.
       * Меняем только этот подарок.
       */

      setGifts((currentGifts) =>
        currentGifts.map((gift) =>
          gift.id === giftId
            ? {
                ...gift,
                is_reserved: true,
              }
            : gift
        )
      );

      setMyReservedGiftIds((current) =>
        current.includes(giftId)
          ? current
          : [...current, giftId]
      );

      setGiftError("");
    } else {
      /*
       * Подарок уже забронировал другой человек.
       * Не перезагружаем весь список.
       */

      setGifts((currentGifts) =>
        currentGifts.map((gift) =>
          gift.id === giftId
            ? {
                ...gift,
                is_reserved: true,
              }
            : gift
        )
      );

      setGiftError(
        "Этот подарок уже забронировал кто-то другой. Выберите другой подарок."
      );
    }
  } catch (error) {
    console.error(
      "RESERVE GIFT ERROR:",
      error
    );

    setGiftError(
      "Не удалось забронировать подарок. Проверьте интернет и попробуйте ещё раз."
    );
  } finally {
    setReservingGiftId(null);
  }
}
  /* =========================
   CANCEL GIFT
========================= */

async function cancelGift(
  giftId: string,
  event?: MouseEvent<HTMLButtonElement>
) {
  event?.preventDefault();
  event?.stopPropagation();

  setGiftError("");

  const currentGuestId =
    guestId ||
    localStorage.getItem("birthday_guest_id");

  if (!currentGuestId) {
    setGiftError(
      "Не удалось определить гостя. Пожалуйста, подтвердите присутствие ещё раз."
    );

    return;
  }

  const confirmed = window.confirm(
    "Отменить бронирование этого подарка?"
  );

  if (!confirmed) {
    return;
  }

  setCancelingGiftId(giftId);

  try {
    const { data, error } =
      await supabase.rpc("cancel_gift", {
        p_gift_id: giftId,
        p_guest_id: currentGuestId,
      });

    if (error) {
      console.error(
        "CANCEL GIFT ERROR:",
        error
      );

      setGiftError(
        `Не удалось отменить бронирование: ${error.message}`
      );

      return;
    }

    if (data === true) {
      /*
       * Меняем только эту карточку.
       * Весь список не перезагружаем.
       */

      setGifts((currentGifts) =>
        currentGifts.map((gift) =>
          gift.id === giftId
            ? {
                ...gift,
                is_reserved: false,
              }
            : gift
        )
      );

      setMyReservedGiftIds((current) =>
        current.filter(
          (id) => id !== giftId
        )
      );

      setGiftError("");
    } else {
      /*
       * Бронирование уже отсутствует.
       */

      setMyReservedGiftIds((current) =>
        current.filter(
          (id) => id !== giftId
        )
      );

      setGifts((currentGifts) =>
        currentGifts.map((gift) =>
          gift.id === giftId
            ? {
                ...gift,
                is_reserved: false,
              }
            : gift
        )
      );

      setGiftError(
        "Это бронирование уже было отменено."
      );
    }
  } catch (error) {
    console.error(
      "CANCEL GIFT ERROR:",
      error
    );

    setGiftError(
      "Не удалось отменить бронирование. Проверьте интернет и попробуйте ещё раз."
    );
  } finally {
    setCancelingGiftId(null);
  }
}

  /* =========================
     GROUP GIFTS
  ========================= */

  const giftGroups =
    giftGroupInfo.map(
      (group, index) => ({
        ...group,
        gifts: gifts.slice(
          index * 5,
          index * 5 + 5
        ),
      })
    );

  return (
    <main className="birthday-site">

      {/* =========================
          HERO
      ========================= */}

      <section className="hero-section">

        <div className="hero-title">
          You're Invited
          <span>•</span>
          Birthday evening
        </div>

        <div className="hero-photo">
          <img
            src="/images/hero.jpg"
            alt="Karina birthday"
          />
        </div>

        <div className="hero-name">

          <div className="age">
            19
          </div>

          <div className="name">
            Karina
          </div>

        </div>

        <div className="hero-date">
          04 • 11 • 2026
          <span>|</span>
          19:00
        </div>

        <div className="info-card">

          <div className="info-item">
            <div className="info-label">
              ДАТА
            </div>

            <div className="info-value">
              4 ноября 2026
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">
              НАЧАЛО
            </div>

            <div className="info-value">
              19:00
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">
              МЕСТО
            </div>

            <div className="info-value">
              Ресторан
              <br />
              "Венеция"
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">
              АДРЕС
            </div>

            <div className="info-value">
              М.Батыра 11/9
            </div>
          </div>

        </div>

        <div className="scroll-down">
          ↓
        </div>

      </section>


      {/* =========================
          PHOTO 01
      ========================= */}

      <section className="photo-section">

        <div className="full-photo">

          <img
            src="/images/photo2.jpg"
            alt=""
          />

        </div>

      </section>


      {/* =========================
          НЕМНОГО О ВЕЧЕРЕ
      ========================= */}

      <section className="text-section">

        <div className="text-card">

          <div className="small-heading">
            THE EVENING
          </div>

          <h2>
            Этот вечер
            <br />
            мы проведём вместе
          </h2>

          <p>
            Хочу собрать рядом самых
            любимых людей и просто
            наслаждаться этим вечером
            вместе с вами.
          </p>

          <div className="decor-line">
            ✦
          </div>

        </div>

      </section>


      {/* =========================
          PHOTO 02
      ========================= */}

      <section className="photo-section">

        <div className="full-photo">

          <img
            src="/images/photo3.jpg"
            alt=""
          />

        </div>

      </section>


      {/* =========================
          DRESS CODE
      ========================= */}

      <section className="dress-section">

        <div className="dress-photo">

          <img
            src="/images/photo4.jpg"
            alt=""
          />

        </div>

        <div className="dress-card">

          <div className="section-label">
            Dress code
          </div>

          <p>
            В этот вечер хочется
            видеть вас в моем
            любимом цвете
          </p>

        </div>

        <div className="black-card">

          <div className="black-title">
            Total Black
          </div>

          <div className="black-description">
            черный образ • элегантность •
            вечерний стиль
          </div>

        </div>

      </section>


      {/* =========================
          RSVP
      ========================= */}

      <section className="rsvp-section">

        <div className="rsvp-card">

          <div className="section-label">
            Подтвердите присутствие
          </div>

          <h2>
            Вы будете?
          </h2>

          <div className="question">
            Напишите своё имя
          </div>

          <input
            className="custom-input name-input"
            type="text"
            placeholder="Ваше имя"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <div className="question">
            Выберите вариант
          </div>

          <div className="choice-group">

            <button
              type="button"
              className={`choice-button ${
                attending === "yes"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setAttending("yes")
              }
            >
              Да, конечно
            </button>

            <button
              type="button"
              className={`choice-button ${
                attending === "no"
                  ? "selected"
                  : ""
              }`}
              onClick={() => {
                setAttending("no");
                setAlcohol("");
                setCustomAlcohol("");
              }}
            >
              К сожалению, нет
            </button>

          </div>


          {/* =========================
              ALCOHOL
          ========================= */}

          <div className="question alcohol-question">

            Какой алкогольный напиток
            <br />
            предпочитаете?

          </div>

          <div className="choice-group">

            <button
              type="button"
              className={`choice-button ${
                alcohol === "Коньяк"
                  ? "selected"
                  : ""
              }`}
              onClick={() => {
                setAlcohol("Коньяк");
                setCustomAlcohol("");
              }}
            >
              Коньяк
            </button>

            <button
              type="button"
              className={`choice-button ${
                alcohol === "Водка"
                  ? "selected"
                  : ""
              }`}
              onClick={() => {
                setAlcohol("Водка");
                setCustomAlcohol("");
              }}
            >
              Водка
            </button>

            <button
              type="button"
              className={`choice-button ${
                alcohol === "Вино"
                  ? "selected"
                  : ""
              }`}
              onClick={() => {
                setAlcohol("Вино");
                setCustomAlcohol("");
              }}
            >
              Вино
            </button>

            <button
              type="button"
              className={`choice-button ${
                alcohol === "Не употребляю"
                  ? "selected"
                  : ""
              }`}
              onClick={() => {
                setAlcohol(
                  "Не употребляю"
                );
                setCustomAlcohol("");
              }}
            >
              Не употребляю
            </button>

            <button
              type="button"
              className={`choice-button ${
                alcohol === "Свой вариант"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setAlcohol("Свой вариант")
              }
            >
              Свой вариант
            </button>

          </div>

          {alcohol === "Свой вариант" && (
            <input
              className="custom-input"
              type="text"
              placeholder="Напишите свой вариант"
              value={customAlcohol}
              onChange={(e) =>
                setCustomAlcohol(
                  e.target.value
                )
              }
            />
          )}

          {rsvpError && (
            <div className="form-message error-message">
              {rsvpError}
            </div>
          )}

          {rsvpSuccess && (
            <div className="form-message success-message">
              Спасибо, {name}! Ваш ответ
              сохранён 🤍
            </div>
          )}

          <button
            type="button"
            className="submit-button"
            onClick={handleRsvp}
            disabled={rsvpLoading}
          >
            {rsvpLoading
              ? "Сохраняем..."
              : "Добавить себя в список"}
          </button>

          <div className="privacy-text">
            Ваш ответ только для организации
            вечера и поможет учесть
            предпочтения гостей
          </div>

        </div>

      </section>


      {/* =========================
          WISHLIST INTRO
      ========================= */}

      <section className="wishlist-section">

        <div className="wishlist-title">
          Вишлист
        </div>

        <div className="wishlist-description">

          <h2>
            🎁 Немного о подарках
          </h2>

          <p>
            Дорогие мои, если вы задумываетесь
            о подарке, я буду очень рада
            денежному подарку — так я смогу
            сама выбрать то, что действительно
            хочется и будет радовать меня. 🤍
          </p>

          <p>
            А если вам захочется дополнить его
            чем-то особенным, ниже я оставила
            небольшой вишлист. Выбирать что-то
            из него совсем не обязательно —
            это лишь для тех, кому хочется
            сделать приятное дополнение.
          </p>

          <p>
            Если выберете подарок из списка,
            пожалуйста, отметьте его — он
            забронируется за вами, чтобы
            подарки не повторялись. ✨
          </p>

        </div>

        <div className="wishlist-note">
          20 little wishes
        </div>

      </section>


      {/* =========================
          GIFTS
      ========================= */}

      {giftError && (
        <div className="gift-global-message">
          {giftError}
        </div>
      )}

      {giftsLoading ? (
        <section className="gift-loading">
          Загружаем список подарков...
        </section>
      ) : (
        giftGroups.map((group) => (
          <section
            className="gift-section"
            key={group.number}
          >

            <div className="gift-section-heading">

              <div className="gift-number">
                {group.number}
              </div>

              <div className="gift-section-title">
                {group.title}
              </div>

              <div className="gift-section-subtitle">
                {group.subtitle}
              </div>

            </div>

            <div className="gifts-grid">

              {group.gifts.map((gift) => {

                const isReserved =
                  gift.is_reserved;

                const isMine =
                  myReservedGiftIds.includes(
                    gift.id
                  );

                const isReserving =
                  reservingGiftId === gift.id;

                const isCanceling =
                  cancelingGiftId === gift.id;

                return (
                  <div
                    className={`gift-card ${
                      isReserved
                        ? "reserved"
                        : ""
                    }`}
                    key={gift.id}
                  >

                    <div className="gift-image">

                      <img
                        src={gift.image_url}
                        alt={gift.name}
                      />

                      <div className="gift-number-badge">
                        {String(
                          gifts.indexOf(gift) + 1
                        ).padStart(2, "0")}
                      </div>

                    </div>

                    <div className="gift-content">

                      <div className="gift-name">
                        {gift.name}
                      </div>

                      <div className="gift-description">
                        {gift.description}
                      </div>


                      {/* МОЙ ПОДАРОК */}

                      {isReserved && isMine ? (

                        <button
                          type="button"
                          className="gift-button cancel-button"
                          disabled={isCanceling}
                          onClick={(event) =>
                            cancelGift(
                              gift.id,
                              event
                            )
                          }
                        >
                          {isCanceling
                            ? "Отменяем..."
                            : "Отменить бронирование"}
                        </button>


                      ) : isReserved ? (

                        /* ЧУЖОЙ ПОДАРОК */

                        <button
                          type="button"
                          className="gift-button reserved-button"
                          disabled
                        >
                          Забронировано
                        </button>


                      ) : (

                        /* СВОБОДНЫЙ ПОДАРОК */

                        <button
                          type="button"
                          className="gift-button"
                          disabled={isReserving}
                          onClick={(event) =>
                            reserveGift(
                              gift.id,
                              event
                            )
                          }
                        >
                          {isReserving
                            ? "Бронируем..."
                            : "Забронировать подарок"}
                        </button>

                      )}

                    </div>

                  </div>
                );
              })}

            </div>

          </section>
        ))
      )}


      {/* =========================
          PHOTO AFTER WISHLIST
      ========================= */}

      <section className="photo-section">

        <div className="full-photo">

          <img
            src="/images/photo6.jpg"
            alt=""
          />

        </div>

      </section>


      {/* =========================
          LAST MESSAGE
      ========================= */}

      <section className="closing-section">

        <div className="closing-card">

          <div className="small-heading">
            ONE LAST THING
          </div>

          <h2>
            Самое главное —
            <br />
            ваше присутствие
          </h2>

          <p>
            Спасибо, что будете частью
            моего особенного вечера.
          </p>

          <div className="closing-symbol">
            ♡
          </div>

        </div>

      </section>


      {/* =========================
          FINAL
      ========================= */}

      <section className="final-section">

        <div className="final-photo">

          <img
            src="/images/photo8.jpg"
            alt=""
          />

        </div>

        <div className="final-card">

          <div className="final-title">
            До встречи
          </div>

          <p>
            Буду очень ждать этот вечер
            и каждого из вас
          </p>

        </div>

      </section>

    </main>
  );
}