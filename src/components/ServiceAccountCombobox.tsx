import React, { useState, useEffect, useRef } from "react";
import { serviceAccountService, ServiceAccount } from "../services/serviceAccountService";

interface Props {
  label: string;
  placeholder: string;
  value: string;
  provider: string;
  onChange: (accountId: string, sa: ServiceAccount | null) => void;
}

const ServiceAccountCombobox = ({ label, placeholder, value, provider, onChange }: Props) => {
  const [accounts, setAccounts] = useState<ServiceAccount[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    serviceAccountService.findAll().then(setAccounts).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = accounts.filter((sa) => {
    const matchesProvider = !provider || sa.Provider === provider;
    const matchesValue =
      value.trim() === "" ||
      (sa.SecondaryID ?? "").toLowerCase().includes(value.toLowerCase()) ||
      (sa.AccountName ?? "").toLowerCase().includes(value.toLowerCase());
    return matchesProvider && matchesValue;
  });

  const handleSelect = (sa: ServiceAccount) => {
    onChange(sa.SecondaryID ?? "", sa);
    setOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value, null);
    setOpen(true);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="label-text text-[#1d1d1f]/45">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full bg-white border border-[#1d1d1f]/08 rounded-lg shadow-lg max-h-52 overflow-y-auto">
            {filtered.map((sa) => (
              <li
                key={sa.id}
                onMouseDown={() => handleSelect(sa)}
                className="px-4 py-2.5 text-sm text-[#1d1d1f] cursor-pointer hover:bg-[#f5f5f7] flex flex-col"
              >
                <span className="font-medium">{sa.SecondaryID}</span>
                {sa.AccountName && (
                  <span className="text-xs text-[#1d1d1f]/40">{sa.AccountName}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ServiceAccountCombobox;
