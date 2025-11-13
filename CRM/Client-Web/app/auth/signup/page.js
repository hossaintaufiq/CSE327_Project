
// "use client";
// import { useState } from "react";
// import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
// import { auth } from "@/firebase/config";
// import { useRouter } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";

// export default function Signup() {
//   const [form, setForm] = useState({ name: "", email: "", password: "" });
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const router = useRouter();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       // Create user
//       const userCredential = await createUserWithEmailAndPassword(
//         auth,
//         form.email,
//         form.password
//       );

//       // Update display name
//       await updateProfile(userCredential.user, {
//         displayName: form.name,
//       });

//       // Show animated success popup
//       setSuccess(true);

//       // Redirect to login after 2 seconds
//       setTimeout(() => {
//         router.push("/auth/login");
//       }, 2000);
//     } catch (error) {
//       console.error("Signup error:", error.message);
//       alert(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-black text-white px-4 relative overflow-hidden">
//       {/* Background effects */}
//       <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/20 to-transparent blur-3xl animate-pulse"></div>
//       <div className="absolute top-24 -left-10 w-28 h-28 bg-indigo-600/40 rounded-3xl animate-spin-slow [transform:rotateX(25deg)] shadow-2xl"></div>
//       <div className="absolute bottom-32 right-10 w-16 h-16 bg-indigo-500/40 rounded-xl animate-bounce"></div>
//       <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-indigo-800/30 rounded-lg animate-slow-bounce"></div>

//       {/* Animated success popup */}
//       <AnimatePresence>
//         {success && (
//           <motion.div
//             initial={{ opacity: 0, scale: 0.9, y: -30 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             exit={{ opacity: 0, scale: 0.9, y: -30 }}
//             transition={{ duration: 0.3 }}
//             className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-semibold flex items-center space-x-2 z-50"
//           >
//             <span>🎉 Account created successfully! Redirecting...</span>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Form */}
//       <div className="relative bg-white/10 backdrop-blur-xl p-10 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl transform hover:scale-[1.02] transition">
//         <h2 className="text-3xl font-bold text-center mb-2">Create Account</h2>
//         <p className="text-zinc-300 text-center text-sm mb-6">
//           AI-powered CRM — Automate & Grow Faster 🚀
//         </p>

//         <form onSubmit={handleSubmit} className="space-y-5">
//           {/* Name */}
//           <div>
//             <label className="block text-sm mb-1">Full Name</label>
//             <input
//               type="text"
//               value={form.name}
//               onChange={(e) => setForm({ ...form, name: e.target.value })}
//               required
//               placeholder="John Doe"
//               className="w-full px-4 py-3 rounded-lg bg-black/30 border border-zinc-700 focus:border-indigo-500 outline-none"
//             />
//           </div>

//           {/* Email */}
//           <div>
//             <label className="block text-sm mb-1">Email Address</label>
//             <input
//               type="email"
//               value={form.email}
//               onChange={(e) => setForm({ ...form, email: e.target.value })}
//               required
//               placeholder="you@example.com"
//               className="w-full px-4 py-3 rounded-lg bg-black/30 border border-zinc-700 focus:border-indigo-500 outline-none"
//             />
//           </div>

//           {/* Password */}
//           <div className="relative">
//             <label className="block text-sm mb-1">Password</label>
//             <input
//               type={showPassword ? "text" : "password"}
//               value={form.password}
//               onChange={(e) => setForm({ ...form, password: e.target.value })}
//               required
//               placeholder="••••••••"
//               className="w-full px-4 py-3 rounded-lg bg-black/30 border border-zinc-700 focus:border-indigo-500 outline-none pr-12"
//             />

//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-3 top-[38px] text-zinc-300 hover:text-white"
//             >
//               {showPassword ? "🙈" : "👁️"}
//             </button>
//           </div>

//           {/* Button */}
//           <button
//             type="submit"
//             disabled={loading}
//             className={`w-full py-3 mt-2 rounded-lg font-semibold shadow-lg transition transform hover:scale-105 ${
//               loading
//                 ? "bg-indigo-400 cursor-not-allowed"
//                 : "bg-indigo-600 hover:bg-indigo-700"
//             }`}
//           >
//             {loading ? "Creating..." : "Create Account"}
//           </button>
//         </form>

//         {/* Redirect */}
//         <p className="text-center mt-6 text-sm text-zinc-400">
//           Already registered?{" "}
//           <a href="/auth/login" className="text-indigo-400 hover:underline">
//             Sign in
//           </a>
//         </p>
//       </div>
//     </div>
//   );
// }


"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/firebase/config";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Password validation rules
  const passwordRules = {
    minLength: /.{8,}/,
    upperCase: /[A-Z]/,
    lowerCase: /[a-z]/,
    number: /[0-9]/,
    specialChar: /[!@#$%^&*]/,
  };

  const validatePassword = (password) => {
    return Object.values(passwordRules).every((regex) => regex.test(password));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate password
    if (!validatePassword(form.password)) {
      setError(
        "Password does not meet all requirements. Please fix the issues below."
      );
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      await updateProfile(userCredential.user, {
        displayName: form.name,
      });

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err) {
      console.error("Signup error:", err.message);

      // Check if email already exists
      if (err.code === "auth/email-already-in-use") {
        setError("❌ This email is already registered. Please login or use another email.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderRule = (label, test) => (
    <p className={`text-sm ${test ? "text-green-400" : "text-red-400"}`}>
      {test ? "✔️" : "❌"} {label}
    </p>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/20 to-transparent blur-3xl animate-pulse"></div>
      <div className="absolute top-24 -left-10 w-28 h-28 bg-indigo-600/40 rounded-3xl animate-spin-slow [transform:rotateX(25deg)] shadow-2xl"></div>
      <div className="absolute bottom-32 right-10 w-16 h-16 bg-indigo-500/40 rounded-xl animate-bounce"></div>
      <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-indigo-800/30 rounded-lg animate-slow-bounce"></div>

      {/* Success popup */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{ duration: 0.3 }}
            className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-semibold flex items-center space-x-2 z-50"
          >
            <span>🎉 Account created successfully! Redirecting...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <div className="relative bg-white/10 backdrop-blur-xl p-10 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl transform hover:scale-[1.02] transition">
        <h2 className="text-3xl font-bold text-center mb-2">Create Account</h2>
        <p className="text-zinc-300 text-center text-sm mb-6">
          AI-powered CRM — Automate & Grow Faster 🚀
        </p>

        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-zinc-700 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-zinc-700 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm mb-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-zinc-700 focus:border-indigo-500 outline-none pr-12"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-zinc-300 hover:text-white"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>

            {/* Password rules */}
            <div className="mt-2 space-y-1">
              {Object.entries(passwordRules).map(([key, regex]) => {
                const labelMap = {
                  minLength: "At least 8 characters",
                  upperCase: "At least 1 uppercase letter",
                  lowerCase: "At least 1 lowercase letter",
                  number: "At least 1 number",
                  specialChar: "At least 1 special character (!@#$%^&*)",
                };
                return (
                  <p
                    key={key}
                    className={`text-sm ${
                      regex.test(form.password)
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {regex.test(form.password) ? "✔️" : "❌"} {labelMap[key]}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 mt-2 rounded-lg font-semibold shadow-lg transition transform hover:scale-105 ${
              loading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        {/* Redirect */}
        <p className="text-center mt-6 text-sm text-zinc-400">
          Already registered?{" "}
          <a href="/auth/login" className="text-indigo-400 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
