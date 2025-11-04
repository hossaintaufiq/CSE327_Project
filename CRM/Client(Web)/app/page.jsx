"use client";
import React, { useState } from "react";

export default function LeadsPage() {
  const [leads, setLeads] = useState([
    { id: 1, name: "Naafuew Hossain", email: "naafuew@demo.com", status: "New" },
    { id: 2, name: "Taufiq Hossain", email: "taufiq@demo.com", status: "Contacted" },
    { id: 3, name: "Nazmul Hasan", email: "nazmul@demo.com", status: "Qualified" },
  ]);

  const [form, setForm] = useState({ name: "", email: "", status: "New" });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.email) {
      alert("Please enter name and email");
      return;
    }

    const newLead = {
      id: leads.length + 1,
      ...form,
    };

    setLeads([...leads, newLead]);

    setForm({ name: "", email: "", status: "New" });
  };

  return (
    <div style={{ padding: "25px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ marginBottom: "20px" }}>Leads Management</h1>

      {/* form for adding leads */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={{ padding: "8px", flex: "1" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={{ padding: "8px", flex: "1" }}
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          style={{ padding: "8px" }}
        >
          <option>New</option>
          <option>Contacted</option>
          <option>Qualified</option>
        </select>
        <button
          type="submit"
          style={{
            padding: "8px 16px",
            backgroundColor: "#0070f3",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </form>

      {/* leads table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f4f4f4" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>ID</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Name</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Email</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{lead.id}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{lead.name}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{lead.email}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{lead.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}