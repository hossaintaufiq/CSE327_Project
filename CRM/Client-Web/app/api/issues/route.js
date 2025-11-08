// Just need to replace the array logic with DB queries, when DB will be avaialable
let issues = [];

export async function GET() {
  return new Response(JSON.stringify(issues), { status: 200 });
}

export async function POST(req) {
  const { title, description, status } = await req.json();
  const newIssue = { id: issues.length + 1, title, description, status };
  issues.push(newIssue);
  return new Response(JSON.stringify({ message: "Issue added", issue: newIssue }), { status: 201 });
}
