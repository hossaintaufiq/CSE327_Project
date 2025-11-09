
// "use client";
// import { useState } from "react";
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { auth } from "@/firebase/config"; // adjust path if needed
// import { useRouter } from "next/navigation";

// export default function Login() {
//   const [form, setForm] = useState({ email: "", password: "" });
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   const handleSubmit = async e => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       await signInWithEmailAndPassword(auth, form.email, form.password);
//       alert("✅ Login successful!");
//       router.push("/dashboard"); // redirect after login
//     } catch (error) {
//       console.error(error);
//       alert(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">
//       <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/30 to-transparent blur-3xl animate-pulse"></div>
//       <div className="absolute top-20 left-10 w-24 h-24 bg-indigo-600/40 rounded-xl animate-spin-slow [transform:rotateX(30deg)] shadow-xl"></div>
//       <div className="absolute bottom-24 right-14 w-16 h-16 bg-indigo-500/40 rounded-lg animate-bounce"></div>

//       <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl transform hover:scale-[1.02] transition">
//         <h2 className="text-3xl font-bold text-center mb-6">Welcome Back 👋</h2>
//         <p className="text-center text-zinc-300 mb-8 text-sm">
//           Login to continue managing your CRM with AI power
//         </p>

//         <form onSubmit={handleSubmit} className="space-y-5">
//           <div>
//             <label className="block text-sm text-zinc-400 mb-1">Email</label>
//             <input
//               type="email"
//               required
//               placeholder="you@example.com"
//               value={form.email}
//               onChange={e => setForm({ ...form, email: e.target.value })}
//               className="w-full px-4 py-3 rounded-lg bg-black/30 border border-zinc-700 focus:border-indigo-500 outline-none text-white"
//             />
//           </div>

//           <div className="relative">
//             <label className="block text-sm text-zinc-400 mb-1">Password</label>
//             <input
//               type={showPassword ? "text" : "password"}
//               required
//               placeholder="********"
//               value={form.password}
//               onChange={e => setForm({ ...form, password: e.target.value })}
//               className="w-full px-4 py-3 rounded-lg bg-black/30 border border-zinc-700 focus:border-indigo-500 outline-none text-white"
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-3 top-[38px] text-sm text-zinc-300 hover:text-white"
//             >
//               {showPassword ? "🙈" : "👁️"}
//             </button>
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white transition transform hover:scale-105"
//           >
//             {loading ? "Logging in..." : "Login"}
//           </button>
//         </form>

//         <p className="text-center text-sm text-zinc-400 mt-5">
//           Don’t have an account?{" "}
//           <a href="/auth/signup" className="text-indigo-400 hover:text-indigo-300">
//             Register
//           </a>
//         </p>
//       </div>
//     </div>
//   );
// }

// new code 
"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/config"; // adjust path if needed
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/30 to-transparent blur-3xl animate-pulse"></div>
      <div className="absolute top-20 left-10 w-24 h-24 bg-indigo-600/40 rounded-xl animate-spin-slow [transform:rotateX(30deg)] shadow-xl"></div>
      <div className="absolute bottom-24 right-14 w-16 h-16 bg-indigo-500/40 rounded-lg animate-bounce"></div>

      {/* Animated success popup */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{ duration: 0.3 }}
            className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-semibold flex items-center space-x-2"
          >
            <span>✅ Login successful! Redirecting...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glassmorphism Card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl transform hover:scale-[1.02] transition">
        <h2 className="text-3xl font-bold text-center mb-6">Welcome Back 👋</h2>
        <p className="text-center text-zinc-300 mb-8 text-sm">
          Login to continue managing your CRM with AI power
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-zinc-700 focus:border-indigo-500 outline-none text-white"
            />
          </div>

          <div className="relative">
            <label className="block text-sm text-zinc-400 mb-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="********"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-zinc-700 focus:border-indigo-500 outline-none text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-sm text-zinc-300 hover:text-white"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition transform hover:scale-105 ${
              loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-400 mt-5">
          Don’t have an account?{" "}
          <a href="/auth/signup" className="text-indigo-400 hover:text-indigo-300">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}

