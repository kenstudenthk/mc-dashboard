import React, { useState, useEffect, useRef } from "react";
import { customerService, Customer } from "../services/customerService";

interface Props {
  label?: string;
  value: string;
  onChange: (name: string, id: number | null) => void;
}

const CustomerCombobox = ({ label = "Company Name", value, onChange }: Props) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    customerService.findAll().then(setCustomers).catch(() => {});
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

  const filtered =
    value.trim() === ""
      ? customers
      : customers.filter((c) =>
          c.Company.toLowerCase().includes(value.toLowerCase()),
        );

  const handleSelect = (customer: Customer) => {
    onChange(customer.Company, customer.id);
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
          placeholder="e.g. New World Corporate Services Limited"
          className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full bg-white border border-[#1d1d1f]/08 rounded-lg shadow-lg max-h-52 overflow-y-auto">
            {filtered.map((c) => (
              <li
                key={c.id}
                onMouseDown={() => handleSelect(c)}
                className="px-4 py-2.5 text-sm text-[#1d1d1f] cursor-pointer hover:bg-[#f5f5f7] flex flex-col"
              >
                <span className="font-medium">{c.Company}</span>
                <span className="text-xs text-[#1d1d1f]/40">{c.Title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CustomerCombobox;
