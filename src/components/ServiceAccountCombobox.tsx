import React, { useState, useEffect, useRef } from "react";
import {
  serviceAccountService,
  ServiceAccount,
} from "../services/serviceAccountService";
import { Search, CheckCircle, PlusCircle, X } from "lucide-react";

interface Props {
  label: string;
  placeholder: string;
  value: string;
  provider: string;
  onChange: (accountId: string, sa: ServiceAccount | null) => void;
}

type CheckResult = "found" | "new" | null;

const ServiceAccountCombobox = ({
  label,
  placeholder,
  value,
  provider,
  onChange,
}: Props) => {
  const [accounts, setAccounts] = useState<ServiceAccount[]>([]);
  const [open, setOpen] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult>(null);
  const [checkedAccount, setCheckedAccount] = useState<ServiceAccount | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    serviceAccountService
      .findAll()
      .then(setAccounts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
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
    setCheckResult("found");
    setCheckedAccount(sa);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value, null);
    setCheckResult(null);
    setCheckedAccount(null);
    setOpen(true);
  };

  const handleCheck = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const match = accounts.find(
      (sa) =>
        (!provider || sa.Provider === provider) &&
        (sa.SecondaryID ?? "").toLowerCase() === trimmed.toLowerCase(),
    );

    if (match) {
      setCheckResult("found");
      setCheckedAccount(match);
    } else {
      setCheckResult("new");
      setCheckedAccount(null);
    }
    setOpen(false);
  };

  const handleUseAccount = () => {
    if (checkedAccount) handleSelect(checkedAccount);
  };

  const handleDismissResult = () => {
    setCheckResult(null);
    setCheckedAccount(null);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="label-text text-[#1d1d1f]/45">{label}</label>
      <div className="relative flex gap-2">
        <div className="flex-1 relative">
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
                    <span className="text-xs text-[#1d1d1f]/40">
                      {sa.AccountName}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={handleCheck}
          disabled={!value.trim()}
          title="Check if this Account ID exists"
          className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-[#094cb2] text-white text-xs font-medium rounded-lg hover:bg-[#0a3d8f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          Check
        </button>
      </div>

      {checkResult === "found" && checkedAccount && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-green-800">
                  Existing Account Found
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  <span className="font-medium">
                    {checkedAccount.SecondaryID}
                  </span>
                  {checkedAccount.AccountName && (
                    <span className="text-green-600">
                      {" "}
                      · {checkedAccount.AccountName}
                    </span>
                  )}
                </p>
                {checkedAccount.LoginEmail && (
                  <p className="text-xs text-green-600 mt-0.5">
                    {checkedAccount.LoginEmail}
                  </p>
                )}
                {checkedAccount.PrimaryAccountID && (
                  <p className="text-xs text-green-600 mt-0.5">
                    Billing: {checkedAccount.PrimaryAccountID}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleUseAccount}
                className="text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 border border-green-300 px-2.5 py-1 rounded transition-colors"
              >
                Fill Fields
              </button>
              <button
                type="button"
                onClick={handleDismissResult}
                className="text-green-500 hover:text-green-700 transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {checkResult === "new" && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-800">
                  New Account
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  No existing account found for{" "}
                  <span className="font-medium">{value}</span>. A new service
                  account will be created on save.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismissResult}
              className="text-blue-400 hover:text-blue-600 transition-colors shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceAccountCombobox;
