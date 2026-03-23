"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatDate(value) {
  return new Date(value).toLocaleString("ru-RU");
}

function toDatetimeLocalValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part) => String(part).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function isEnded(endTime) {
  return new Date(endTime).getTime() <= Date.now();
}

export default function AdminLotsList({ initialLots }) {
  const [lots, setLots] = useState(initialLots);
  const [loadingKey, setLoadingKey] = useState("");
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState(() => {
    const map = {};
    for (const lot of initialLots) {
      map[lot.id] = {
        title: lot.title || "",
        image_url: lot.image_url || "",
        avito_link: lot.avito_link || "",
        min_step: String(Number(lot.min_step || 1)),
        delivery_price: String(Number(lot.delivery_price || 0)),
        end_time: toDatetimeLocalValue(lot.end_time)
      };
    }
    return map;
  });

  const hasLots = useMemo(() => lots.length > 0, [lots]);

  const updateDraft = (lotId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [lotId]: {
        ...(prev[lotId] || {}),
        [field]: value
      }
    }));
  };

  const saveLot = async (lotId) => {
    const draft = drafts[lotId];
    if (!draft) return;

    setMessage("");
    setLoadingKey(`${lotId}:save`);

    const response = await fetch(`/api/admin/lots/${lotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        image_url: draft.image_url,
        avito_link: draft.avito_link,
        min_step: Number(draft.min_step),
        delivery_price: Number(draft.delivery_price),
        end_time: draft.end_time
      })
    });

    const body = await response.json();

    if (!response.ok) {
      setMessage(body.error || "Не удалось сохранить изменения");
      setLoadingKey("");
      return;
    }

    setLots((prev) => prev.map((lot) => (lot.id === lotId ? body.lot : lot)));
    setDrafts((prev) => ({
      ...prev,
      [lotId]: {
        title: body.lot.title || "",
        image_url: body.lot.image_url || "",
        avito_link: body.lot.avito_link || "",
        min_step: String(Number(body.lot.min_step || 1)),
        delivery_price: String(Number(body.lot.delivery_price || 0)),
        end_time: toDatetimeLocalValue(body.lot.end_time)
      }
    }));

    setMessage("Изменения сохранены");
    setLoadingKey("");
  };

  const closeLot = async (lotId) => {
    setMessage("");
    setLoadingKey(`${lotId}:close`);

    const response = await fetch(`/api/admin/lots/${lotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" })
    });

    const body = await response.json();

    if (!response.ok) {
      setMessage(body.error || "Не удалось закрыть лот");
      setLoadingKey("");
      return;
    }

    setLots((prev) => prev.map((lot) => (lot.id === lotId ? body.lot : lot)));
    setDrafts((prev) => ({
      ...prev,
      [lotId]: {
        title: body.lot.title || "",
        image_url: body.lot.image_url || "",
        avito_link: body.lot.avito_link || "",
        min_step: String(Number(body.lot.min_step || 1)),
        delivery_price: String(Number(body.lot.delivery_price || 0)),
        end_time: toDatetimeLocalValue(body.lot.end_time)
      }
    }));

    setMessage("Лот закрыт");
    setLoadingKey("");
  };

  return (
    <>
      {!hasLots ? <p>Лотов пока нет.</p> : null}

      {hasLots ? (
        <div className="lots-list">
          {lots.map((lot) => (
            <div className="lot-item" key={lot.id}>
              <div className="stack">
                <strong>{lot.title}</strong>
                <p>slug: {lot.slug}</p>
                <p>Текущая цена: {formatMoney(lot.current_price)}</p>
                <p>Минимальный шаг: {formatMoney(lot.min_step)}</p>
                <p>Доставка: {formatMoney(lot.delivery_price)}</p>
                <p>Окончание: {formatDate(lot.end_time)}</p>
                <p>
                  Статус: <strong>{isEnded(lot.end_time) ? "завершен" : "активен"}</strong>
                </p>
              </div>

              <div className="stack lot-actions">
                <label>
                  Название
                  <input
                    value={drafts[lot.id]?.title || ""}
                    onChange={(event) => updateDraft(lot.id, "title", event.target.value)}
                  />
                </label>

                <label>
                  Ссылка на изображение
                  <input
                    type="url"
                    value={drafts[lot.id]?.image_url || ""}
                    onChange={(event) => updateDraft(lot.id, "image_url", event.target.value)}
                  />
                </label>

                <label>
                  Ссылка на Avito
                  <input
                    type="url"
                    value={drafts[lot.id]?.avito_link || ""}
                    onChange={(event) => updateDraft(lot.id, "avito_link", event.target.value)}
                  />
                </label>

                <label>
                  Минимальный шаг
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={drafts[lot.id]?.min_step || "1"}
                    onChange={(event) => updateDraft(lot.id, "min_step", event.target.value)}
                  />
                </label>

                <label>
                  Цена доставки
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={drafts[lot.id]?.delivery_price || "0"}
                    onChange={(event) => updateDraft(lot.id, "delivery_price", event.target.value)}
                  />
                </label>

                <label>
                  Время окончания
                  <input
                    type="datetime-local"
                    value={drafts[lot.id]?.end_time || ""}
                    onChange={(event) => updateDraft(lot.id, "end_time", event.target.value)}
                  />
                </label>

                <div className="row-actions">
                  <button
                    className="button"
                    type="button"
                    onClick={() => saveLot(lot.id)}
                    disabled={loadingKey.startsWith(`${lot.id}:`)}
                  >
                    {loadingKey === `${lot.id}:save` ? "Сохраняем..." : "Сохранить"}
                  </button>

                  {!isEnded(lot.end_time) ? (
                    <button
                      className="button button-outline"
                      type="button"
                      onClick={() => closeLot(lot.id)}
                      disabled={loadingKey.startsWith(`${lot.id}:`)}
                    >
                      {loadingKey === `${lot.id}:close` ? "Закрываем..." : "Закрыть лот"}
                    </button>
                  ) : null}

                  <Link className="button button-outline" href={`/lot/${lot.slug}`}>
                    Открыть
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {message ? <p>{message}</p> : null}
    </>
  );
}
