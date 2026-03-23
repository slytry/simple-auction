"use client";

import { useState } from "react";

const initialState = {
  title: "",
  image_url: "",
  avito_link: "",
  start_price: "",
  min_step: "",
  delivery_price: "0",
  end_time: ""
};

export default function AdminCreateLotForm() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setCreatedSlug("");

    const response = await fetch("/api/admin/lots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        start_price: Number(form.start_price),
        min_step: Number(form.min_step),
        delivery_price: Number(form.delivery_price || 0)
      })
    });

    const body = await response.json();

    if (!response.ok) {
      setError(body.error || "Не удалось создать лот");
      setLoading(false);
      return;
    }

    setCreatedSlug(body.slug);
    setForm(initialState);
    setLoading(false);
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  };

  return (
    <div className="stack">
      <div className="row-between">
        <h1>Создание лота</h1>
        <div className="row-actions">
          <a className="button button-outline" href="/admin/lots">
            Все лоты
          </a>
          <button type="button" className="button button-outline" onClick={logout}>
            Выйти
          </button>
        </div>
      </div>

      <form className="stack" onSubmit={onSubmit}>
        <label>
          Название
          <input name="title" value={form.title} onChange={onChange} required />
        </label>

        <label>
          Ссылка на изображение
          <input name="image_url" type="url" value={form.image_url} onChange={onChange} required />
        </label>

        <label>
          Ссылка на Avito
          <input name="avito_link" type="url" value={form.avito_link} onChange={onChange} required />
        </label>

        <label>
          Стартовая цена
          <input
            name="start_price"
            type="number"
            min="0"
            step="1"
            value={form.start_price}
            onChange={onChange}
            required
          />
        </label>

        <label>
          Минимальный шаг
          <input
            name="min_step"
            type="number"
            min="1"
            step="1"
            value={form.min_step}
            onChange={onChange}
            required
          />
        </label>

        <label>
          Цена доставки
          <input
            name="delivery_price"
            type="number"
            min="0"
            step="1"
            value={form.delivery_price}
            onChange={onChange}
          />
        </label>

        <label>
          Время окончания
          <input name="end_time" type="datetime-local" value={form.end_time} onChange={onChange} required />
        </label>

        <button className="button" type="submit" disabled={loading}>
          {loading ? "Создаем..." : "Создать лот"}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {createdSlug ? (
        <div className="success-box">
          <p>Лот создан.</p>
          <a href={`/lot/${createdSlug}`} target="_blank" rel="noreferrer">
            Открыть /lot/{createdSlug}
          </a>
        </div>
      ) : null}
    </div>
  );
}
