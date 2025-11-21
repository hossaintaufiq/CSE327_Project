import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "CRM SaaS Platform",
  description: "Multi-tenant CRM with role-based access",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <Navbar/>
        <main>{children}</main>
      </body>
    </html>
  );
}

