export const API_BASE_URL = "http://localhost:5000/api";
export const api = async (url, token) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};
