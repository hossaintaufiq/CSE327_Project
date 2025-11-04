"use client";
import React, { useState } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([
    { id: 1, name: "Rafia Khan", email: "rafia@demo.com" },
    { id: 2, name: "Rafi Khan", email: "rafi@demo.com" },
  ]);

  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Both name and email are required!");
      return;
    }

    const newCustomer = {
      id: customers.length + 1,
      ...formData,
    };

    setCustomers([...customers, newCustomer]);
    setFormData({ name: "", email: "" });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Customer Management</h2>

      {/* Form for adding a new customer */}
      <form
        onSubmit={handleAddCustomer}
        style={{ display: "flex", gap: "10px", margin: "20px 0" }}
      >
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={{ flex: 1, padding: "8px" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          style={{ flex: 1, padding: "8px" }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: "#0070f3",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </form>

      {/* Customer table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>ID</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Name</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Email</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{c.id}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{c.name}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{c.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
