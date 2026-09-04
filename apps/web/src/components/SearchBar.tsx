import { useState, FormEvent } from "react";
import { Search } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="relative flex w-full max-w-2xl">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        size={18}
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products and reviews..."
        className="input !rounded-r-none !pl-11 !text-base"
      />
      <button
        type="submit"
        className="btn-primary !rounded-l-none !px-6 !text-base"
      >
        Search
      </button>
    </form>
  );
}
