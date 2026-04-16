"use client";
import { useState } from "react";
export default function DataDeletion() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-4">Data Deletion Request</h1>
      <p className="text-gray-600 mb-8">Request deletion of all your personal and business data from maroa.ai. We will process within 30 days.</p>
      {submitted ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-2">Request Received</h2>
          <p className="text-green-700">We received your deletion request for <strong>{email}</strong>. You will receive confirmation within 30 days.</p>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3" placeholder="your@email.com" />
          </div>
          <button type="submit" className="bg-red-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-700">Request Data Deletion</button>
        </form>
      )}
    </div>
  );
}
