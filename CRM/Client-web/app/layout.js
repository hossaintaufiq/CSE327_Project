import "./globals.css";
import Navbar from "@/components/Navbar";
import ConditionalFooter from "@/components/ConditionalFooter";

export const metadata = {
  title: "CRM Prime - Powerful CRM for Modern Businesses",
  description: "Manage your customers, projects, and teams all in one place. Streamline your workflow and boost productivity.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body style={{ margin: 0, padding: 0, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar/>
        <main style={{ flex: 1 }}>{children}</main>
        <ConditionalFooter/>
      </body>
    </html>
  );
}

