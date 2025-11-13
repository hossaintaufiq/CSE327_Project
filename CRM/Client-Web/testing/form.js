"use client";

import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";

export default function AddUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/users`, { name, email });
      alert(`User created: ${res.data.name}`);
      setName("");
      setEmail("");
    } catch (error) {
      console.error(error);
      alert("Failed to create user");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <button type="submit">Add User</button>
    </form>
  );
}
