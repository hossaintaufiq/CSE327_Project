"use client"; // If using Next.js 13 app router

import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";

export default function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/users`);
        setUsers(res.data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div>
      <h1>Users</h1>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul>
          {users.map(user => (
            <li key={user._id}>{user.name} ({user.email})</li>
          ))}
        </ul>
      )}
    </div>
  );
}
