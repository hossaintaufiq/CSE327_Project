"use client";
import { useState } from "react";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await fetch("/api/auth", {
      method: "POST",
      body: JSON.stringify({ ...form, action: "signup" }),
    });
    const data = await res.json();
    alert(data.message || data.error);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
      <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
      <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
      <button type="submit">Sign Up</button>
    </form>
  );
}

