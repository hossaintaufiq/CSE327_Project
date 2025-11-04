"use client";
import React, { useState } from "react";

export default function DashboardPage() {
  const [leads] = useState([
    { id: 1, name: "Naafuew Hossain" },
    { id: 2, name: "Asif Anik" },
  ]);

  const [customers] = useState([
    { id: 1, name: "Rafia Khan" },
    { id: 2, name: "Rafi Khan" },
  ]);

  return (
    <div style={{ padding: "30px", fontFamily: "Segoe UI, sans-serif" }}>
      <h1 style={{ marginBottom: "20px", color: "#222" }}>Welcome to CRM Dashboard</h1>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {/* CardNum 1 --> Total Leads */}
        <div style={{
          flex: "1 1 200px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
        }}>
          <h3>Total Leads</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold" }}>{leads.length}</p>
        </div>

        {/* CardNum2 --> Total Customers */}
        <div style={{
          flex: "1 1 200px",
          padding: "20px",
          backgroundColor: "#e3f2fd",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
        }}>
          <h3>Total Customers</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold" }}>{customers.length}</p>
        </div>

        {/* CardNum 3 --> Most Recent Lead */}
        <div style={{
          flex: "1 1 200px",
          padding: "20px",
          backgroundColor: "#fff3e0",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
        }}>
          <h3>Recent Lead</h3>
          <p style={{ fontSize: "18px" }}>{leads[leads.length - 1]?.name || "No leads yet"}</p>
        </div>
      </div>
    </div>
  );
}
