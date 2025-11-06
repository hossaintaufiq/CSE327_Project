"use client";
import React, { useState } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([
    { id: 1, name: "Rafia Khan", email: "rafia@demo.com" },
    { id: 2, name: "Rafi Khan", email: "rafi@demo.com" },
  ]);

  const [formData, setFormData] = useState({ name: "", email: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [editId, setEditId] = useState(null); // for editing mode

  // Add or update
  const handleAddOrEditCustomer = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      alert("Both name and email are required!");
      return;
    }

    if (editId) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editId ? { ...c, name: formData.name, email: formData.email } : c
        )
      );
      setEditId(null);
    } else {
      const newCustomer = {
        id: customers.length + 1,
        ...formData,
      };
      setCustomers([...customers, newCustomer]);
    }

    setFormData({ name: "", email: "" });
  };

  // Delete, edit, filter, and sort start from here
  const handleDeleteCustomer = (id) => {
    const filtered = customers.filter((c) => c.id !== id);
    setCustomers(filtered);
  };

  const handleEditCustomer = (customer) => {
    setEditId(customer.id);
    setFormData({ name: customer.name, email: customer.email });
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortOrder === "asc") return a.name.localeCompare(b.name);
    return b.name.localeCompare(a.name);
  });

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Customer Management</h2>

      {/* Search and sort controlling */}
      <div style={{ display: "flex", gap: "10px", margin: "10px 0" }}>
        <input
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: "8px" }}
        />
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{ padding: "8px" }}
        >
          <option value="asc">Sort: A–Z</option>
          <option value="desc">Sort: Z–A</option>
        </select>
      </div>

      {/* Add or edit customer form */}
      <form
        onSubmit={handleAddOrEditCustomer}
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
          {editId ? "Update" : "Add"}
        </button>
        {editId && (
          <button
            type="button"
            onClick={() => {
              setEditId(null);
              setFormData({ name: "", email: "" });
            }}
            style={{
              backgroundColor: "#999",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* Customer table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>ID</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Name</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Email</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedCustomers.map((c) => (
            <tr key={c.id}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{c.id}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{c.name}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{c.email}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                <button
                  onClick={() => handleEditCustomer(c)}
                  style={{
                    backgroundColor: "#ffa500",
                    color: "#fff",
                    border: "none",
                    padding: "5px 10px",
                    cursor: "pointer",
                    marginRight: "5px",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCustomer(c.id)}
                  style={{
                    backgroundColor: "#ff4d4f",
                    color: "#fff",
                    border: "none",
                    padding: "5px 10px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
