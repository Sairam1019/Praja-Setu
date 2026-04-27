import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // ✅ install if not present: npm install jwt-decode
import { loginUser } from "../apis";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const data = await loginUser({ email, password });

    if (data.token) {
      localStorage.setItem("token", data.token);

      let userId = data.userId;

      if (!userId && data.token) {
        try {
          const decoded = jwtDecode(data.token);
          userId = decoded.id;
        } catch (e) {
          console.warn("Token decode failed", e);
        }
      }

      if (userId) {
        localStorage.setItem("userId", userId);
      }

      let redirectPath = "/dashboard";

      if (data.role === "admin") {
        redirectPath = "/admin_dash";
      } else if (data.role === "department") {
        redirectPath = "/dept_dash";
      }

      // ✅ IMPORTANT FIX (reload)
      window.location.href = redirectPath;

    } else {
      setError("Invalid email or password");
    }

  } catch (err) {
    console.error(err);
    setError(err.message || "Login failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm border-2 border-indigo-500 rounded-2xl shadow-xl p-6 md:p-8 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
        <h2 className="text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">
          Welcome Back
        </h2>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Logging in...
              </div>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition"
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;