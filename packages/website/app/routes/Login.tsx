import { useState } from "react";
import { useAuth } from "../AuthContext";
import { Link } from "react-router-dom";
import React from 'react';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    login(form);
  };

  return (
<div className="flex h-screen font-cute bg-pink-50">
  {/* Left: Illustration */}
  <div className="relative hidden md:flex w-2/3 h-full overflow-hidden">
    <img
      src="https://cdn.shopify.com/s/files/1/0758/3993/files/Bees_Lavender.jpg?v=1621533197"
      className="w-full h-full object-cover"
      alt="Bees and Lavender"
    />
    {/* Gradient overlay with narrower fade */}
    <div className="absolute inset-0 bg-gradient-to-l from-pink-50 to-transparent [mask-image:linear-gradient(to left,transparent_80%,black)]"></div>
  </div>

  {/* Right: Form Box */}
  <div className="flex flex-col justify-center items-center w-full md:w-1/3 px-6">
    <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md">
      <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">
        🐝 Welcome to Busy Bees
      </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border border-purple-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="border border-purple-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
              required
            />
            <button
              type="submit"
              className="bg-purple-400 text-white font-semibold py-3 rounded-xl hover:bg-purple-500 transition-all"
            >
              Sign In
            </button>
          </form>

          <p className="text-sm text-center mt-4 text-gray-600">
            Don’t have an account?{" "}
            <Link to="/register" className="text-purple-600 underline">
              Register now →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
