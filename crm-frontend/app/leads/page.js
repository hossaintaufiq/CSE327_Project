// Leads Page

import React from "react";

const leadsData = [
  { id: 1, name: "Naafuew Hossain", email: "naafuew@demo.com", status: "New" },
  { id: 2, name: "Taufiq Hossain", email: "taufiq@demo.com", status: "Contacted" },
  { id: 3, name: "Nazmul Hasan", email: "nazmul@demo.com", status: "Qualified" },
  { id: 4, name: "Asif Anik", email: "asif@demo.com", status: "New" },
  { id: 5, name: "Karim Hossain", email: "karim@demo.com", status: "New" },
  { id: 6, name: "Rahim Hossain", email: "rahim@demo.com", status: "Contacted" },
  { id: 7, name: "Rohan Hossain", email: "rohan@demo.com", status: "Qualified" }
];

export default function LeadsPage() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Leads List</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>ID</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Name</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Email</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {leadsData.map((lead) => (
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

