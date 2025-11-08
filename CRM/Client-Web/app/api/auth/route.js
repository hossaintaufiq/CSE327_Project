// Need to replace users.push & users.find with DB calls, when DB will be ready
let users = [];

export async function POST(req) {
  const { action, name, email, password } = await req.json();

  if (action === "signup") {
    if (users.find(u => u.email === email)) {
      return new Response(JSON.stringify({ error: "User exists" }), { status: 400 });
    }
    const newUser = { id: users.length + 1, name, email, password };
    users.push(newUser);
    return new Response(JSON.stringify({ message: "Signup successful!", user: newUser }), { status: 201 });
  }

  if (action === "login") {
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    return new Response(JSON.stringify({ message: "Login successful", user }), { status: 200 });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400 });
}
