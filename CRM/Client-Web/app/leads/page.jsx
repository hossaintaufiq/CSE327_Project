"use client";
import React, { useState } from "react";

export default function LeadsPage() {
  const [leads, setLeads] = useState([
    { id: 1, name: "Naafuew Hossain", email: "naafuew@demo.com", status: "New" },
    { id: 2, name: "Taufiq Hossain", email: "taufiq@demo.com", status: "Contacted" },
    { id: 3, name: "Nazmul Hasan", email: "nazmul@demo.com", status: "Qualified" },
  ]);

  const [form, setForm] = useState({ name: "", email: "", status: "New" });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.email) {
      alert("Please enter name and email");
      return;
    }

    if (editingId) {
      setLeads(
        leads.map((lead) =>
          lead.id === editingId ? { ...lead, ...form } : lead
        )
      );
      setEditingId(null);
    } else {
      const newLead = { id: leads.length + 1, ...form };
      setLeads([...leads, newLead]);
    }

    setForm({ name: "", email: "", status: "New" });
  };

  const handleEdit = (lead) => {
    setEditingId(lead.id);
    setForm({ name: lead.name, email: lead.email, status: lead.status });
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      setLeads(leads.filter((lead) => lead.id !== id));
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "All" ? true : lead.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ padding: "25px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ marginBottom: "20px" }}>Leads Management</h1>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px", flex: "1" }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "8px" }}
        >
          <option>All</option>
          <option>New</option>
          <option>Contacted</option>
          <option>Qualified</option>
        </select>
      </div>

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
          {editingId ? "Update" : "Add"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", email: "", status: "New" });
            }}
            style={{
              padding: "8px 16px",
              backgroundColor: "#999",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f4f4f4" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>ID</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Name</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Email</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Status</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredLeads.map((lead) => (
            <tr key={lead.id}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{lead.id}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{lead.name}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{lead.email}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{lead.status}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                <button
                  onClick={() => handleEdit(lead)}
                  style={{
                    padding: "4px 8px",
                    marginRight: "5px",
                    backgroundColor: "#f0ad4e",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(lead.id)}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#d9534f",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {filteredLeads.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "10px" }}>
                No leads found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
