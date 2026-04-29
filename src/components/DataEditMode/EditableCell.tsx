import React from "react";
import { Order } from "../../services/orderService";

const STATUS_OPTIONS = [
  "Processing",
  "Pending for order issued",
  "Pending for other parties",
  "Account Created",
  "Completed",
  "Cancelled",
];

const ORDER_TYPE_OPTIONS = [
  "New Install",
  "Misc Change",
  "Contract Renewal",
  "Termination",
  "Pre-Pro",
];

const CLOUD_PROVIDER_OPTIONS = [
  "AWS (Amazon Web Service)",
  "Microsoft Azure",
  "Huawei Cloud",
  "Google Cloud Platform (GCP)",
  "AliCloud",
  "Tencent",
];

const T2T3_OPTIONS = ["T1", "T2", "T3", "N/A"];
const YES_NO_OPTIONS = ["Y", "N"];
const YES_NO_FULL_OPTIONS = ["Yes", "No"];

const SELECT_OPTIONS: Partial<Record<keyof Order, readonly string[]>> = {
  Status: STATUS_OPTIONS,
  OrderType: ORDER_TYPE_OPTIONS,
  CloudProvider: CLOUD_PROVIDER_OPTIONS,
  T2T3: T2T3_OPTIONS,
  PSJob: YES_NO_OPTIONS,
  WelcomeLetter: YES_NO_FULL_OPTIONS,
};

const DATE_FIELDS = new Set<keyof Order>([
  "SRD",
  "OrderReceiveDate",
  "CxSCompleteDate",
]);

interface Props {
  field: keyof Order;
  value: string | number | undefined;
  isDirty: boolean;
  onChange: (value: string | number) => void;
}

export function EditableCell({ field, value, isDirty, onChange }: Props) {
  const base =
    "w-full py-1 px-2 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-[#0071e3]/40 focus:border-[#0071e3] transition-colors";
  const cls = `${base} ${
    isDirty
      ? "bg-yellow-50 border-yellow-300"
      : "bg-white border-[#1d1d1f]/10"
  }`;

  const options = SELECT_OPTIONS[field];
  if (options) {
    return (
      <select
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (DATE_FIELDS.has(field)) {
    return (
      <input
        type="date"
        value={typeof value === "string" ? value.slice(0, 10) : ""}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
      />
    );
  }

  if (field === "Amount") {
    return (
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        className={cls}
      />
    );
  }

  return (
    <input
      type="text"
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={cls}
    />
  );
}
