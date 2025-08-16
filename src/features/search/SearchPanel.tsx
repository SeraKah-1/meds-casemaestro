// src/features/search/SearchPanel.tsx
import { useState } from "react";

export default function SearchPanel() {
  const [query, setQuery] = useState("");
  const [url, setUrl] = useState("https://www.google.com/search?igu=1");

  const handleSearch = () => {
    if (query.trim()) {
      setUrl(
        `https://www.google.com/search?q=${encodeURIComponent(query)}&igu=1`
      );
    } else {
      setUrl("https://www.google.com/search?igu=1");
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 flex gap-2 border-b border-gray-700">
        <input
          type="text"
          placeholder="Cari istilah medis / Search medical terms..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-grow p-2 bg-gray-800 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-semibold"
        >
          🔍 Cari
        </button>
      </div>
      <div className="flex-grow">
        <iframe
          src={url}
          title="Google Embedded Search"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
