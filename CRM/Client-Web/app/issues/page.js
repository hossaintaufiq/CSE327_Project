"use client";
import { useState, useEffect } from "react";

export default function IssuesPage() {
  const [issues, setIssues] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", status: "New" });

  const fetchIssues = async () => {
    const res = await fetch("/api/issues");
    const data = await res.json();
    setIssues(data);
  };

  useEffect(() => { fetchIssues(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    await fetch("/api/issues", { method: "POST", body: JSON.stringify(form) });
    setForm({ title: "", description: "", status: "New" });
    fetchIssues();
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title:e.target.value})}/>
        <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description:e.target.value})}/>
        <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
          <option>New</option>
          <option>In Progress</option>
          <option>Closed</option>
        </select>
        <button type="submit">Add Issue</button>
      </form>

      <ul>
        {issues.map(i => <li key={i.id}>{i.title} - {i.status}</li>)}
      </ul>
    </div>
  );
}

