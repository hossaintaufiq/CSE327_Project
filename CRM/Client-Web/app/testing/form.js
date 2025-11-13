"use client"; // Required for client-side React features

import { useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api"; // Your backend URL

export default function Form() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API_BASE_URL}/users`, { name, email });
      setMessage(`User created: ${res.data.name}`);
      setName("");
      setEmail("");
    } catch (error) {
      console.error(error);
      setMessage("Failed to create user");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px" }}>
      <h2>Add a User</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" style={{ padding: "8px", background: "blue", color: "white" }}>Add User</button>
      </form>
    </div>
  );
}
