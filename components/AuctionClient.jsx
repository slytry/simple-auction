"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabaseBrowser";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Europe/Moscow"
});

function sortBids(items) {
  return [...items].sort((a, b) => {
    if (Number(b.amount) !== Number(a.amount)) {
      return Number(b.amount) - Number(a.amount);
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatDate(value) {
  return dateFormatter.format(new Date(value));
}

function getTimeLeftText(endTime, nowMs = Date.now()) {
  const diff = new Date(endTime).getTime() - nowMs;
  if (diff <= 0) return "Завершен";

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days} д ${hours} ч ${minutes} мин ${seconds} сек`;
  }

  if (hours > 0) {
    return `${hours} ч ${minutes} мин ${seconds} сек`;
  }

  return `${minutes} мин ${seconds} сек`;
}

export default function AuctionClient({ initialLot, initialBids, initialNowMs }) {
  const [lot, setLot] = useState(initialLot);
  const [bids, setBids] = useState(sortBids(initialBids));
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(String(Number(initialLot.current_price) + Number(initialLot.min_step)));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(getTimeLeftText(initialLot.end_time, initialNowMs));
  const [myName, setMyName] = useState("");

  const isEnded = useMemo(() => timeLeft === "Завершен", [timeLeft]);
  const highestBid = bids[0] || null;
  const hasMyBid = myName ? bids.some((bid) => bid.name === myName) : false;
  const isOutbid = hasMyBid && highestBid && highestBid.name !== myName;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeftText(lot.end_time));
    }, 1000);

    return () => clearInterval(timer);
  }, [lot.end_time]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`lot-${lot.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lots",
          filter: `id=eq.${lot.id}`
        },
        (payload) => {
          setLot(payload.new);
          setAmount(String(Number(payload.new.current_price) + Number(payload.new.min_step)));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `lot_id=eq.${lot.id}`
        },
        (payload) => {
          setBids((prev) => sortBids([payload.new, ...prev]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lot.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isEnded || loading) return;

    const rateLimitKey = `lot_bid_last_${lot.id}`;
    const last = Number(localStorage.getItem(rateLimitKey) || 0);
    if (Date.now() - last < 3000) {
      setMessage("Подождите 3 секунды перед следующей ставкой.");
      return;
    }

    setLoading(true);
    setMessage("");

    const response = await fetch(`/api/lots/${lot.slug}/bid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, amount: Number(amount) })
    });

    const body = await response.json();

    if (!response.ok) {
      setMessage(body.error || "Не удалось поставить ставку");
      setLoading(false);
      return;
    }

    localStorage.setItem(rateLimitKey, String(Date.now()));
    setMyName(name.trim());
    setMessage("Ставка принята");
    setLoading(false);
  };

  return (
    <div className="auction-layout">
      <div className="card stack">
        <img className="lot-image" src={lot.image_url} alt={lot.title} />
        <h1>{lot.title}</h1>
        <a href={lot.avito_link} target="_blank" rel="noreferrer">
          Открыть объявление Avito
        </a>

        <div className="meta-grid">
          <p>
            Текущая цена: <strong>{formatMoney(lot.current_price)}</strong>
          </p>
          <p>
            Доставка: <strong>{formatMoney(lot.delivery_price)}</strong>
          </p>
          <p>
            Итого: <strong>{formatMoney(Number(lot.current_price) + Number(lot.delivery_price || 0))}</strong>
          </p>
          <p>
            До окончания: <strong>{timeLeft}</strong>
          </p>
          <p>
            Окончание: <strong>{formatDate(lot.end_time)}</strong>
          </p>
        </div>

        {isEnded ? (
          <div className="ended-box">
            <p>Аукцион завершен</p>
            <p>
              Победитель: <strong>{highestBid ? highestBid.name : "Ставок нет"}</strong>
            </p>
            {highestBid ? (
              <p>
                Финальная ставка: <strong>{formatMoney(highestBid.amount)}</strong>
              </p>
            ) : null}
          </div>
        ) : (
          <form className="stack" onSubmit={handleSubmit}>
            <label>
              Ваше имя
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} required />
            </label>

            <label>
              Сумма ставки
              <input
                type="number"
                min={Number(lot.current_price) + Number(lot.min_step)}
                step="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </label>

            <button className="button" type="submit" disabled={loading}>
              {loading ? "Отправка..." : "Поставить ставку"}
            </button>
          </form>
        )}

        {message ? <p>{message}</p> : null}
        {isOutbid ? <p className="warning">Ваша ставка перебита.</p> : null}
      </div>

      <div className="card stack">
        <h2>Ставки</h2>
        {bids.length === 0 ? <p>Пока нет ставок.</p> : null}
        <ul className="bid-list">
          {bids.map((bid) => (
            <li key={bid.id}>
              <span>{bid.name}</span>
              <span>{formatMoney(bid.amount)}</span>
              <span>{formatDate(bid.created_at)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
