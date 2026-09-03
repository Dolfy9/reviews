import { useState, FormEvent } from "react";

interface SearchBarProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
}

export function SearchBar({ initialQuery = "", onSearch }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products and reviews..."
        className="flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="submit"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
      >
        Search
      </button>
    </form>
  );
}
