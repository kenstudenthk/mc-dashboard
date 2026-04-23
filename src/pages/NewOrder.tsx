import React, { useState } from "react";
import { ArrowLeft, Save, AlertCircle, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { TutorTooltip } from "../components/TutorTooltip";
import CustomerCombobox from "../components/CustomerCombobox";
import { orderService } from "../services/orderService";
import { customerService } from "../services/customerService";
import { serviceAccountService } from "../services/serviceAccountService";
import { usePermission } from "../contexts/PermissionContext";

const REQUIRED_FIELDS = new Set([
  "companyName",
  "orderType",
  "status",
  "productSubscribe",
  "srd",
]);
const isRequired = (f: string) => REQUIRED_FIELDS.has(f);

const CLOUD_PROVIDER_MAP: Record<string, string> = {
  "AWS (Amazon Web Service)": "AWS",
  "Microsoft Azure": "Azure",
  "Huawei Cloud": "Huawei",
  "Google Cloud Platform (GCP)": "GCP",
  AliCloud: "Alibaba",
  Tencent: "Tencent",
};

const STATUS_OPTIONS = [
  "Completed",
  "Account Created",
  "Pending for order issued",
  "Processing",
  "Cancelled",
  "Pending Closure",
  "Pending for other parties",
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

// ─── Design tokens ────────────────────────────────────────────────────────────
const OAT_BORDER = "border-[#dad4c8]";
const OAT_BG = "bg-[#faf9f7]";
const SECONDARY_TEXT = "text-[#9f9b93]";
const TERTIARY_TEXT = "text-[#55534e]";

const inputBase =
  "w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[rgb(20,110,245)]/20 focus:border-[rgb(20,110,245)] transition-all text-sm text-black placeholder:text-[#9f9b93]";
const filledInput = "bg-white border-[#094cb2]/40";
const emptyInput = `${OAT_BG} ${OAT_BORDER}`;

// ─── Primitive Components ─────────────────────────────────────────────────────
const FieldLabel = ({
  text,
  required,
}: {
  text: string;
  required?: boolean;
}) => (
  <label className={`label-text ${SECONDARY_TEXT} flex items-center gap-1`}>
    {text}
    {required && <span className="text-[#094cb2] font-semibold">*</span>}
  </label>
);

const InputGroup = ({
  label,
  type = "text",
  placeholder = "",
  disabled = false,
  required = false,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="space-y-1.5">
    <FieldLabel text={label} required={required} />
    <input
      type={type}
      disabled={disabled}
      value={value}
      onChange={onChange}
      required={required}
      className={`${inputBase} ${value && value.trim() ? filledInput : emptyInput} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      placeholder={placeholder}
    />
  </div>
);

const SelectGroup = ({
  label,
  options,
  required = false,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) => (
  <div className="space-y-1.5">
    <FieldLabel text={label} required={required} />
    <select
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(20,110,245)]/20 focus:border-[rgb(20,110,245)] transition-all appearance-none text-sm ${value && value !== "" ? "bg-white border-[#094cb2]/40 text-black" : `${OAT_BG} ${OAT_BORDER} ${SECONDARY_TEXT}`}`}
    >
      <option value="">Select…</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const ToggleGroup = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-1.5">
    <FieldLabel text={label} />
    <div
      className={`flex items-center gap-1 p-1 ${OAT_BG} rounded-lg border ${OAT_BORDER} w-fit`}
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? "" : opt)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            value === opt
              ? "bg-[#094cb2] text-white shadow-sm"
              : `${TERTIARY_TEXT} hover:text-black`
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const SegmentedControl = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-1.5">
    <FieldLabel text={label} />
    <div
      className={`flex items-center gap-1 p-1 ${OAT_BG} rounded-lg border ${OAT_BORDER}`}
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? "" : opt)}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
            value === opt
              ? "bg-[#094cb2] text-white shadow-sm"
              : `${TERTIARY_TEXT} hover:text-black`
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <span className={`label-text ${SECONDARY_TEXT} shrink-0`}>{title}</span>
    <div className={`flex-1 h-px bg-[#eee9df]`} />
  </div>
);

const NavItem = ({
  index,
  label,
  active,
  complete,
  onClick,
}: {
  key?: React.Key;
  index: number;
  label: string;
  active: boolean;
  complete: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
      active
        ? "bg-[#e8efff] text-[#094cb2]"
        : `hover:bg-[#f5f3ef] ${TERTIARY_TEXT}`
    }`}
  >
    <span
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all ${
        active
          ? "bg-[#094cb2] text-white"
          : complete
            ? "bg-[#094cb2]/10 text-[#094cb2]"
            : `bg-[#eee9df] ${TERTIARY_TEXT}`
      }`}
    >
      {index + 1}
    </span>
    <span className="text-sm font-medium flex-1 leading-tight">{label}</span>
    {complete && !active && (
      <span className="w-2 h-2 rounded-full bg-[#094cb2]/50 shrink-0" />
    )}
  </button>
);

// ─── Section panels ───────────────────────────────────────────────────────────
interface OrderInfoProps {
  isPreProvision: boolean;
  setIsPreProvision: (v: boolean) => void;
  serviceNo: string;
  setServiceNo: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  orderType: string;
  setOrderType: (v: string) => void;
  serviceType: string;
  setServiceType: (v: string) => void;
  oasisNumber: string;
  setOasisNumber: (v: string) => void;
  subName: string;
  setSubName: (v: string) => void;
  orderReceiveDate: string;
  setOrderReceiveDate: (v: string) => void;
  srd: string;
  setSrd: (v: string) => void;
  cxsCompleteDate: string;
  setCxsCompleteDate: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
}

const OrderInfoSection = ({
  isPreProvision,
  setIsPreProvision,
  serviceNo,
  setServiceNo,
  status,
  setStatus,
  orderType,
  setOrderType,
  serviceType,
  setServiceType,
  oasisNumber,
  setOasisNumber,
  subName,
  setSubName,
  orderReceiveDate,
  setOrderReceiveDate,
  srd,
  setSrd,
  cxsCompleteDate,
  setCxsCompleteDate,
  amount,
  setAmount,
}: OrderInfoProps) => (
  <div
    className={`bg-white border ${OAT_BORDER} rounded-2xl p-8`}
    style={{
      boxShadow:
        "rgba(0,0,0,0.06) 0px 1px 2px, rgba(0,0,0,0.04) 0px -1px 1px inset",
    }}
  >
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={`label-text ${SECONDARY_TEXT} shrink-0`}>
          ORDER INFORMATION
        </span>
        <div className="flex-1 h-px bg-[#eee9df]" />
      </div>
      <TutorTooltip
        text="Check this box if you are creating an account before receiving an official Service No. The Service No. will be set to 'TBC'."
        position="left"
      >
        <button
          type="button"
          onClick={() => setIsPreProvision(!isPreProvision)}
          className="ml-6 flex items-center gap-2.5 shrink-0"
        >
          <div
            className={`relative w-9 h-5 rounded-full transition-colors ${
              isPreProvision ? "bg-[#094cb2]" : "bg-[#dad4c8]"
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isPreProvision ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
          <span
            className={`text-sm font-medium ${TERTIARY_TEXT} whitespace-nowrap`}
          >
            Pre-Provision
          </span>
        </button>
      </TutorTooltip>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <InputGroup
        label="Service No."
        placeholder="e.g. CL549486"
        disabled={isPreProvision}
        value={isPreProvision ? "TBC" : serviceNo}
        onChange={(e) => setServiceNo(e.target.value)}
      />
      <SelectGroup
        label="Status"
        options={STATUS_OPTIONS}
        required={isRequired("status")}
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      />
      <TutorTooltip
        text="Select 'Termination' if you are closing an existing account. This will prompt the system to check for existing records."
        position="bottom"
        wrapperClass="block"
      >
        <SelectGroup
          label="Order Type"
          options={ORDER_TYPE_OPTIONS}
          required={isRequired("orderType")}
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
        />
      </TutorTooltip>

      <InputGroup
        label="Service Type"
        placeholder="e.g. Offset Amount"
        value={serviceType}
        onChange={(e) => setServiceType(e.target.value)}
      />
      <InputGroup
        label="OASIS Number"
        placeholder="e.g. CB23-00007546\1"
        value={oasisNumber}
        onChange={(e) => setOasisNumber(e.target.value)}
      />
      <InputGroup
        label="Project Name"
        placeholder="e.g. Project Alpha"
        value={subName}
        onChange={(e) => setSubName(e.target.value)}
      />

      <InputGroup
        label="Order Receive Date"
        type="date"
        value={orderReceiveDate}
        onChange={(e) => setOrderReceiveDate(e.target.value)}
      />
      <InputGroup
        label="SRD"
        type="date"
        required={isRequired("srd")}
        value={srd}
        onChange={(e) => setSrd(e.target.value)}
      />
      <InputGroup
        label="CxS Complete Date"
        type="date"
        value={cxsCompleteDate}
        onChange={(e) => setCxsCompleteDate(e.target.value)}
      />

      <InputGroup
        label="Amount"
        type="number"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
    </div>

    {orderType === "Termination" && (
      <div className="mt-5 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-red-800">
            Termination Order
          </h3>
          <p className="text-sm text-red-600 mt-1">
            When this order is saved, any existing active orders matching this
            Account ID will be automatically marked as Terminated (highlighted
            in red) in the registry.
          </p>
        </div>
      </div>
    )}
  </div>
);

interface CustomerInfoProps {
  companyName: string;
  setCompanyName: (v: string) => void;
  setCustomerId: (v: number | null) => void;
  contactPerson: string;
  setContactPerson: (v: string) => void;
  contactNo: string;
  setContactNo: (v: string) => void;
  contactEmail: string;
  setContactEmail: (v: string) => void;
  contactNo2: string;
  setContactNo2: (v: string) => void;
  contactEmail2: string;
  setContactEmail2: (v: string) => void;
  billingAddress: string;
  setBillingAddress: (v: string) => void;
}

const CustomerInfoSection = ({
  companyName,
  setCompanyName,
  setCustomerId,
  contactPerson,
  setContactPerson,
  contactNo,
  setContactNo,
  contactEmail,
  setContactEmail,
  contactNo2,
  setContactNo2,
  contactEmail2,
  setContactEmail2,
  billingAddress,
  setBillingAddress,
}: CustomerInfoProps) => (
  <div
    className={`bg-white border ${OAT_BORDER} rounded-2xl p-8`}
    style={{
      boxShadow:
        "rgba(0,0,0,0.06) 0px 1px 2px, rgba(0,0,0,0.04) 0px -1px 1px inset",
    }}
  >
    <SectionHeader title="CUSTOMER INFORMATION" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div className="md:col-span-2">
        <CustomerCombobox
          value={companyName}
          onChange={(name, id) => {
            setCompanyName(name);
            setCustomerId(id);
          }}
        />
      </div>
      <InputGroup
        label="Contact Person"
        placeholder="e.g. Don Ng"
        value={contactPerson}
        onChange={(e) => setContactPerson(e.target.value)}
      />
      <InputGroup
        label="Contact No."
        placeholder="e.g. 67594210"
        value={contactNo}
        onChange={(e) => setContactNo(e.target.value)}
      />
      <div className="md:col-span-2">
        <InputGroup
          label="Contact Email"
          type="email"
          placeholder="email@example.com"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </div>
      <InputGroup
        label="2nd Contact No."
        placeholder="e.g. 67594210"
        value={contactNo2}
        onChange={(e) => setContactNo2(e.target.value)}
      />
      <div className="md:col-span-2">
        <InputGroup
          label="2nd Contact Email"
          type="email"
          placeholder="email@example.com"
          value={contactEmail2}
          onChange={(e) => setContactEmail2(e.target.value)}
        />
      </div>
      <div className="md:col-span-3 space-y-1.5">
        <FieldLabel text="Billing Address" />
        <textarea
          className={`w-full px-4 py-2.5 ${OAT_BG} border ${OAT_BORDER} rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(20,110,245)]/20 focus:border-[rgb(20,110,245)] transition-all min-h-[80px] text-sm text-black placeholder:${SECONDARY_TEXT} resize-none`}
          placeholder="Enter full billing address"
          value={billingAddress}
          onChange={(e) => setBillingAddress(e.target.value)}
        />
      </div>
    </div>
  </div>
);

interface CloudServiceProps {
  productSubscribe: string;
  setProductSubscribe: (v: string) => void;
  resetCloudAccountFields: () => void;
  billingAccount: string;
  setBillingAccount: (v: string) => void;
  accountId: string;
  setAccountId: (v: string) => void;
  accountName: string;
  setAccountName: (v: string) => void;
  accountLoginEmail: string;
  setAccountLoginEmail: (v: string) => void;
  azurePrimaryDomain: string;
  setAzurePrimaryDomain: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  otherAccountInfo: string;
  setOtherAccountInfo: (v: string) => void;
}

const CloudServiceSection = ({
  productSubscribe,
  setProductSubscribe,
  resetCloudAccountFields,
  billingAccount,
  setBillingAccount,
  accountId,
  setAccountId,
  accountName,
  setAccountName,
  accountLoginEmail,
  setAccountLoginEmail,
  azurePrimaryDomain,
  setAzurePrimaryDomain,
  password,
  setPassword,
  otherAccountInfo,
  setOtherAccountInfo,
}: CloudServiceProps) => (
  <div
    className={`bg-white border ${OAT_BORDER} rounded-2xl p-8`}
    style={{
      boxShadow:
        "rgba(0,0,0,0.06) 0px 1px 2px, rgba(0,0,0,0.04) 0px -1px 1px inset",
    }}
  >
    <SectionHeader title="CLOUD SERVICE DETAILS" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="md:col-span-2">
        <SelectGroup
          label="Product Subscribe"
          options={CLOUD_PROVIDER_OPTIONS}
          required={isRequired("productSubscribe")}
          value={productSubscribe}
          onChange={(e) => {
            setProductSubscribe(e.target.value);
            resetCloudAccountFields();
          }}
        />
      </div>

      {!productSubscribe && (
        <div
          className={`md:col-span-2 py-8 text-center text-sm ${SECONDARY_TEXT}`}
        >
          Select a cloud provider above to reveal account fields.
        </div>
      )}

      {productSubscribe === "AWS (Amazon Web Service)" && (
        <>
          <InputGroup
            label="Billing Account / Master Account"
            placeholder="e.g. 7.59168E+11"
            value={billingAccount}
            onChange={(e) => setBillingAccount(e.target.value)}
          />
          <InputGroup
            label="Account ID / Root ID"
            placeholder="e.g. 74430167128"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          />
          <InputGroup
            label="Account Name / Cloud Checker Name"
            placeholder="e.g. CL545725"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
          <InputGroup
            label="Account Login Email"
            type="email"
            placeholder="admin@example.com"
            value={accountLoginEmail}
            onChange={(e) => setAccountLoginEmail(e.target.value)}
          />
        </>
      )}
      {productSubscribe === "AliCloud" && (
        <>
          <InputGroup
            label="UID"
            placeholder="e.g. 5.04886E+15"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          />
          <InputGroup
            label="Admin Email"
            type="email"
            placeholder="admin@example.com"
            value={accountLoginEmail}
            onChange={(e) => setAccountLoginEmail(e.target.value)}
          />
        </>
      )}
      {productSubscribe === "Microsoft Azure" && (
        <>
          <InputGroup
            label="Tenant ID"
            placeholder="e.g. 3d44d6b3-5212-4b12-b3ed-83f62ba12194"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          />
          <InputGroup
            label="Azure Subscription ID"
            placeholder="e.g. 807a0e4b-1c78-4f9b-aeea-1a8f5765f128"
            value={billingAccount}
            onChange={(e) => setBillingAccount(e.target.value)}
          />
          <InputGroup
            label="Primary Domain"
            placeholder="e.g. example.onmicrosoft.com"
            value={azurePrimaryDomain}
            onChange={(e) => setAzurePrimaryDomain(e.target.value)}
          />
          <InputGroup
            label="Admin Email"
            type="email"
            placeholder="admin@example.onmicrosoft.com"
            value={accountLoginEmail}
            onChange={(e) => setAccountLoginEmail(e.target.value)}
          />
        </>
      )}
      {productSubscribe === "Huawei Cloud" && (
        <>
          <InputGroup
            label="Huawei ID"
            placeholder="e.g. ccfb8a2e45374b78860fcfb72194e573"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          />
          <InputGroup
            label="Login Email"
            type="email"
            placeholder="admin@example.com"
            value={accountLoginEmail}
            onChange={(e) => setAccountLoginEmail(e.target.value)}
          />
        </>
      )}
      {productSubscribe === "Google Cloud Platform (GCP)" && (
        <>
          <InputGroup
            label="Billing Account ID"
            placeholder="e.g. 013933-F2938A-CC207B"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          />
          <InputGroup
            label="Admin Email"
            type="email"
            placeholder="admin@example.com"
            value={accountLoginEmail}
            onChange={(e) => setAccountLoginEmail(e.target.value)}
          />
        </>
      )}
      {productSubscribe === "Tencent" && (
        <>
          <InputGroup
            label="Tenant ID"
            placeholder="e.g. 200019722598"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          />
          <InputGroup
            label="Login Email"
            type="email"
            placeholder="admin@example.com"
            value={accountLoginEmail}
            onChange={(e) => setAccountLoginEmail(e.target.value)}
          />
        </>
      )}

      {productSubscribe && (
        <>
          <InputGroup
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="md:col-span-2 space-y-1.5">
            <FieldLabel text="Other Account Information" />
            <textarea
              className={`w-full px-4 py-2.5 ${OAT_BG} border ${OAT_BORDER} rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(20,110,245)]/20 focus:border-[rgb(20,110,245)] transition-all min-h-[80px] text-sm text-black placeholder:${SECONDARY_TEXT} resize-none`}
              placeholder="Domain names, additional IDs, etc."
              value={otherAccountInfo}
              onChange={(e) => setOtherAccountInfo(e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  </div>
);

interface ProvisioningProps {
  cxsRequestNo: string;
  setCxsRequestNo: (v: string) => void;
  tid: string;
  setTid: (v: string) => void;
  sdNumber: string;
  setSdNumber: (v: string) => void;
  psJob: string;
  setPsJob: (v: string) => void;
  welcomeLetter: string;
  setWelcomeLetter: (v: string) => void;
  t2t3: string;
  setT2t3: (v: string) => void;
  by: string;
  setBy: (v: string) => void;
  orderFormUrl: string;
  setOrderFormUrl: (v: string) => void;
  caseId: string;
  setCaseId: (v: string) => void;
  caseIdUrl: string;
  setCaseIdUrl: (v: string) => void;
  remark: string;
  setRemark: (v: string) => void;
}

const ProvisioningSection = ({
  cxsRequestNo,
  setCxsRequestNo,
  tid,
  setTid,
  sdNumber,
  setSdNumber,
  psJob,
  setPsJob,
  welcomeLetter,
  setWelcomeLetter,
  t2t3,
  setT2t3,
  by,
  setBy,
  orderFormUrl,
  setOrderFormUrl,
  caseId,
  setCaseId,
  caseIdUrl,
  setCaseIdUrl,
  remark,
  setRemark,
}: ProvisioningProps) => (
  <div
    className={`bg-white border ${OAT_BORDER} rounded-2xl p-8`}
    style={{
      boxShadow:
        "rgba(0,0,0,0.06) 0px 1px 2px, rgba(0,0,0,0.04) 0px -1px 1px inset",
    }}
  >
    <SectionHeader title="PROVISIONING & TRACKING" />

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <InputGroup
        label="CxS Request No."
        placeholder="e.g. RN822908/1-2"
        value={cxsRequestNo}
        onChange={(e) => setCxsRequestNo(e.target.value)}
      />
      <InputGroup
        label="TID"
        placeholder="e.g. 103690"
        value={tid}
        onChange={(e) => setTid(e.target.value)}
      />
      <InputGroup
        label="SD Number"
        placeholder="e.g. SD11652876"
        value={sdNumber}
        onChange={(e) => setSdNumber(e.target.value)}
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5">
      <ToggleGroup
        label="PS Job"
        options={["Y", "N"]}
        value={psJob}
        onChange={setPsJob}
      />
      <ToggleGroup
        label="Welcome Letter"
        options={["Yes", "No"]}
        value={welcomeLetter}
        onChange={setWelcomeLetter}
      />
      <SegmentedControl
        label="T2 / T3"
        options={["T1", "T2", "T3", "N/A"]}
        value={t2t3}
        onChange={setT2t3}
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
      <InputGroup
        label="Handled By"
        placeholder="e.g. Kilson, Helen, Hin"
        value={by}
        onChange={(e) => setBy(e.target.value)}
      />
      <div className="md:col-span-2">
        <InputGroup
          label="Order Form URL"
          placeholder="http://10.10.10.209/OASIS_FILE_MANAGER/..."
          value={orderFormUrl}
          onChange={(e) => setOrderFormUrl(e.target.value)}
        />
      </div>
      <InputGroup
        label="Case ID"
        placeholder="e.g. CASE-123456"
        value={caseId}
        onChange={(e) => setCaseId(e.target.value)}
      />
      <div className="md:col-span-2">
        <InputGroup
          label="Case ID URL"
          placeholder="https://…"
          value={caseIdUrl}
          onChange={(e) => setCaseIdUrl(e.target.value)}
        />
      </div>
      <div className="md:col-span-3 space-y-1.5">
        <FieldLabel text="Remark" />
        <textarea
          className={`w-full px-4 py-2.5 ${OAT_BG} border ${OAT_BORDER} rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(20,110,245)]/20 focus:border-[rgb(20,110,245)] transition-all min-h-[120px] text-sm text-black placeholder:${SECONDARY_TEXT} resize-none`}
          placeholder="Enter timeline, log updates, or special instructions..."
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />
      </div>
    </div>
  </div>
);

// ─── Page Component ───────────────────────────────────────────────────────────
const NewOrder = () => {
  const navigate = useNavigate();
  const { userEmail } = usePermission();

  const [activeSection, setActiveSection] = useState<number>(0);

  const [isPreProvision, setIsPreProvision] = useState(false);
  const [serviceNo, setServiceNo] = useState("");
  const [status, setStatus] = useState("");
  const [productSubscribe, setProductSubscribe] = useState("");
  const [orderType, setOrderType] = useState("");
  const [srd, setSrd] = useState("");
  const [orderReceiveDate, setOrderReceiveDate] = useState("");
  const [cxsCompleteDate, setCxsCompleteDate] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [oasisNumber, setOasisNumber] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactNo2, setContactNo2] = useState("");
  const [contactEmail2, setContactEmail2] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingAccount, setBillingAccount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountLoginEmail, setAccountLoginEmail] = useState("");
  const [azurePrimaryDomain, setAzurePrimaryDomain] = useState("");
  const [password, setPassword] = useState("");
  const [otherAccountInfo, setOtherAccountInfo] = useState("");
  const [cxsRequestNo, setCxsRequestNo] = useState("");
  const [tid, setTid] = useState("");
  const [sdNumber, setSdNumber] = useState("");
  const [psJob, setPsJob] = useState("");
  const [t2t3, setT2t3] = useState("");
  const [welcomeLetter, setWelcomeLetter] = useState("");
  const [by, setBy] = useState("");
  const [orderFormUrl, setOrderFormUrl] = useState("");
  const [caseId, setCaseId] = useState("");
  const [caseIdUrl, setCaseIdUrl] = useState("");
  const [subName, setSubName] = useState("");
  const [remark, setRemark] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSave = async () => {
    if (!companyName) {
      setSubmitError("Company Name is required.");
      return;
    }
    if (!orderType) {
      setSubmitError("Order Type is required.");
      return;
    }
    if (!status) {
      setSubmitError("Status is required.");
      return;
    }
    if (!productSubscribe) {
      setSubmitError("Product Subscribe is required.");
      return;
    }
    if (!isPreProvision && !serviceNo) {
      setSubmitError("Service No. is required.");
      return;
    }
    if (!srd) {
      setSubmitError("SRD is required.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const cloudProvider =
        CLOUD_PROVIDER_MAP[productSubscribe] || productSubscribe;
      const title = isPreProvision ? "TBC" : serviceNo;

      let resolvedCustomerId = customerId;
      if (!resolvedCustomerId) {
        const newCustomer = await customerService.create(
          {
            Title: companyName,
            Company: companyName,
            Email: "",
            Phone: "",
            Status: "Active",
            Tier: "Standard",
          },
          userEmail,
        );
        resolvedCustomerId = newCustomer.id;
      }

      const order = await orderService.create(
        {
          Title: title,
          CustomerName: companyName,
          CustomerID: resolvedCustomerId ?? undefined,
          OrderType: orderType,
          Status: status,
          SRD: srd,
          CloudProvider: cloudProvider,
          Amount: parseFloat(amount) || 0,
          AccountID: accountId || undefined,
          ServiceType: serviceType || undefined,
          OasisNumber: oasisNumber || undefined,
          OrderReceiveDate: orderReceiveDate || undefined,
          CxSCompleteDate: cxsCompleteDate || undefined,
          ContactPerson: contactPerson || undefined,
          ContactNo: contactNo || undefined,
          ContactEmail: contactEmail || undefined,
          ContactNo2: contactNo2 || undefined,
          ContactEmail2: contactEmail2 || undefined,
          BillingAddress: billingAddress || undefined,
          CxSRequestNo: cxsRequestNo || undefined,
          TID: tid || undefined,
          SDNumber: sdNumber || undefined,
          PSJob: psJob || undefined,
          T2T3: t2t3 || undefined,
          WelcomeLetter: welcomeLetter || undefined,
          By: by || undefined,
          OrderFormURL: orderFormUrl || undefined,
          CaseID: caseId || undefined,
          CaseIDURL: caseIdUrl || undefined,
          Remark: remark || undefined,
          SubName: subName || undefined,
        },
        userEmail,
      );

      if (productSubscribe && order.id) {
        const otherInfo = [
          productSubscribe === "Microsoft Azure" && azurePrimaryDomain
            ? `Domain: ${azurePrimaryDomain}`
            : null,
          otherAccountInfo || null,
        ]
          .filter(Boolean)
          .join("\n");

        await serviceAccountService.create(
          {
            Title: `${title} - ${cloudProvider}`,
            OrderID: order.id,
            Provider: cloudProvider,
            PrimaryAccountID: accountId || undefined,
            SecondaryID: billingAccount || undefined,
            AccountName: accountName || undefined,
            Domain: azurePrimaryDomain || undefined,
            LoginEmail: accountLoginEmail || undefined,
            Password: password || undefined,
            OtherInfo: otherInfo || undefined,
          },
          userEmail,
        );
      }

      setSubmitSuccess(true);
      setTimeout(() => navigate(`/orders/${order.id ?? title}`), 800);
    } catch {
      setSubmitError("Failed to create order. Please try again.");
      setSubmitting(false);
    }
  };

  const resetCloudAccountFields = () => {
    setAccountId("");
    setBillingAccount("");
    setAccountName("");
    setAccountLoginEmail("");
    setAzurePrimaryDomain("");
    setPassword("");
    setOtherAccountInfo("");
  };

  const sectionComplete = [
    status !== "" && orderType !== "",
    companyName !== "",
    productSubscribe !== "",
    cxsRequestNo !== "" || tid !== "" || sdNumber !== "",
  ];

  const SECTION_LABELS = [
    "Order Information",
    "Customer Information",
    "Cloud Service Details",
    "Provisioning & Tracking",
  ];

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-6">
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-4">
          <Link
            to="/orders"
            className={`p-2 ${OAT_BG} border ${OAT_BORDER} rounded-lg hover:bg-white transition-colors`}
          >
            <ArrowLeft className={`w-4 h-4 ${TERTIARY_TEXT}`} />
          </Link>
          <div>
            <h1
              className="text-[26px] font-semibold text-black"
              style={{ letterSpacing: "-0.26px", lineHeight: "1.1" }}
            >
              Create New Order
            </h1>
            <p className={`text-sm ${SECONDARY_TEXT} mt-0.5`}>
              Fill in the details for cloud service provisioning.
            </p>
          </div>
        </div>
        <TutorTooltip
          text="Click here to save the new order to the registry once all required fields are filled."
          position="bottom"
        >
          <button
            onClick={handleSave}
            disabled={submitting || submitSuccess}
            className="gradient-cta px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {submitting ? "Saving…" : "Save Order"}
              </>
            )}
          </button>
        </TutorTooltip>
      </div>

      {submitError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {submitError}
        </div>
      )}

      <div className="flex gap-6 items-start">
        <aside
          className={`w-56 shrink-0 bg-white border ${OAT_BORDER} rounded-2xl p-3`}
          style={{
            position: "sticky",
            top: "1.5rem",
            boxShadow:
              "rgba(0,0,0,0.06) 0px 1px 2px, rgba(0,0,0,0.04) 0px -1px 1px inset",
          }}
        >
          <p className={`label-text ${SECONDARY_TEXT} px-3 pt-1 pb-2`}>
            SECTIONS
          </p>
          <div className="space-y-0.5">
            {SECTION_LABELS.map((label, i) => (
              <NavItem
                key={label}
                index={i}
                label={label}
                active={activeSection === i}
                complete={sectionComplete[i]}
                onClick={(): void => setActiveSection(i)}
              />
            ))}
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {activeSection === 0 && (
            <OrderInfoSection
              isPreProvision={isPreProvision}
              setIsPreProvision={setIsPreProvision}
              serviceNo={serviceNo}
              setServiceNo={setServiceNo}
              status={status}
              setStatus={setStatus}
              orderType={orderType}
              setOrderType={setOrderType}
              serviceType={serviceType}
              setServiceType={setServiceType}
              oasisNumber={oasisNumber}
              setOasisNumber={setOasisNumber}
              subName={subName}
              setSubName={setSubName}
              orderReceiveDate={orderReceiveDate}
              setOrderReceiveDate={setOrderReceiveDate}
              srd={srd}
              setSrd={setSrd}
              cxsCompleteDate={cxsCompleteDate}
              setCxsCompleteDate={setCxsCompleteDate}
              amount={amount}
              setAmount={setAmount}
            />
          )}
          {activeSection === 1 && (
            <CustomerInfoSection
              companyName={companyName}
              setCompanyName={setCompanyName}
              setCustomerId={setCustomerId}
              contactPerson={contactPerson}
              setContactPerson={setContactPerson}
              contactNo={contactNo}
              setContactNo={setContactNo}
              contactEmail={contactEmail}
              setContactEmail={setContactEmail}
              contactNo2={contactNo2}
              setContactNo2={setContactNo2}
              contactEmail2={contactEmail2}
              setContactEmail2={setContactEmail2}
              billingAddress={billingAddress}
              setBillingAddress={setBillingAddress}
            />
          )}
          {activeSection === 2 && (
            <CloudServiceSection
              productSubscribe={productSubscribe}
              setProductSubscribe={setProductSubscribe}
              resetCloudAccountFields={resetCloudAccountFields}
              billingAccount={billingAccount}
              setBillingAccount={setBillingAccount}
              accountId={accountId}
              setAccountId={setAccountId}
              accountName={accountName}
              setAccountName={setAccountName}
              accountLoginEmail={accountLoginEmail}
              setAccountLoginEmail={setAccountLoginEmail}
              azurePrimaryDomain={azurePrimaryDomain}
              setAzurePrimaryDomain={setAzurePrimaryDomain}
              password={password}
              setPassword={setPassword}
              otherAccountInfo={otherAccountInfo}
              setOtherAccountInfo={setOtherAccountInfo}
            />
          )}
          {activeSection === 3 && (
            <ProvisioningSection
              cxsRequestNo={cxsRequestNo}
              setCxsRequestNo={setCxsRequestNo}
              tid={tid}
              setTid={setTid}
              sdNumber={sdNumber}
              setSdNumber={setSdNumber}
              psJob={psJob}
              setPsJob={setPsJob}
              welcomeLetter={welcomeLetter}
              setWelcomeLetter={setWelcomeLetter}
              t2t3={t2t3}
              setT2t3={setT2t3}
              by={by}
              setBy={setBy}
              orderFormUrl={orderFormUrl}
              setOrderFormUrl={setOrderFormUrl}
              caseId={caseId}
              setCaseId={setCaseId}
              caseIdUrl={caseIdUrl}
              setCaseIdUrl={setCaseIdUrl}
              remark={remark}
              setRemark={setRemark}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default NewOrder;
