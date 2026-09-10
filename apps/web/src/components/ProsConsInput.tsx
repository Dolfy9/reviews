import { useState } from "react";
import { Plus, Minus, X } from "lucide-react";

interface ProsConsInputProps {
  pros: string[];
  cons: string[];
  onProsChange: (pros: string[]) => void;
  onConsChange: (cons: string[]) => void;
  maxItems?: number;
  maxLength?: number;
}

export function ProsConsInput({
  pros,
  cons,
  onProsChange,
  onConsChange,
  maxItems = 10,
  maxLength = 100,
}: ProsConsInputProps) {
  const [proInput, setProInput] = useState("");
  const [conInput, setConInput] = useState("");

  const addPro = () => {
    const trimmed = proInput.trim();
    if (!trimmed) return;
    if (pros.length >= maxItems) return;
    if (trimmed.length > maxLength) return;
    onProsChange([...pros, trimmed]);
    setProInput("");
  };

  const addCon = () => {
    const trimmed = conInput.trim();
    if (!trimmed) return;
    if (cons.length >= maxItems) return;
    if (trimmed.length > maxLength) return;
    onConsChange([...cons, trimmed]);
    setConInput("");
  };

  const removePro = (i: number) => {
    onProsChange(pros.filter((_, idx) => idx !== i));
  };

  const removeCon = (i: number) => {
    onConsChange(cons.filter((_, idx) => idx !== i));
  };

  const handleProKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPro();
    }
  };

  const handleConKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCon();
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/10">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          <Plus size={16} />
          Pros
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={proInput}
            onChange={(e) => setProInput(e.target.value)}
            onKeyDown={handleProKey}
            placeholder="Add a pro and press Enter"
            maxLength={maxLength}
            className="input flex-1"
            disabled={pros.length >= maxItems}
          />
          <button
            type="button"
            onClick={addPro}
            disabled={!proInput.trim() || pros.length >= maxItems}
            className="btn-secondary shrink-0 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {pros.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {pros.map((pro, i) => (
              <li
                key={`${pro}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
              >
                {pro}
                <button
                  type="button"
                  onClick={() => removePro(i)}
                  className="rounded-full p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800/50"
                  aria-label={`Remove pro ${pro}`}
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-emerald-600/70 dark:text-emerald-400/60">
          {pros.length}/{maxItems} pros
        </p>
      </div>

      <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 dark:border-rose-900/30 dark:bg-rose-950/10">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-400">
          <Minus size={16} />
          Cons
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={conInput}
            onChange={(e) => setConInput(e.target.value)}
            onKeyDown={handleConKey}
            placeholder="Add a con and press Enter"
            maxLength={maxLength}
            className="input flex-1"
            disabled={cons.length >= maxItems}
          />
          <button
            type="button"
            onClick={addCon}
            disabled={!conInput.trim() || cons.length >= maxItems}
            className="btn-secondary shrink-0 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {cons.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {cons.map((con, i) => (
              <li
                key={`${con}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-800 dark:bg-rose-900/30 dark:text-rose-200"
              >
                {con}
                <button
                  type="button"
                  onClick={() => removeCon(i)}
                  className="rounded-full p-0.5 hover:bg-rose-200 dark:hover:bg-rose-800/50"
                  aria-label={`Remove con ${con}`}
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-rose-600/70 dark:text-rose-400/60">
          {cons.length}/{maxItems} cons
        </p>
      </div>
    </div>
  );
}
