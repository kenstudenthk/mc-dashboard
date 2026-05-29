import React, { useEffect, useState } from "react";
import { ArrowLeft, Save, AlertCircle, CheckCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { TutorTooltip } from "../components/TutorTooltip";
import CustomerCombobox from "../components/CustomerCombobox";
import ServiceAccountCombobox from "../components/ServiceAccountCombobox";
import { orderService } from "../services/orderService";
import { customerService, resolveOrCreateCustomer } from "../services/customerService";
import { serviceAccountService, resolveOrCreateServiceAccount } from "../services/serviceAccountService";
import { usePermission } from "../contexts/PermissionContext";
import { CLOUD_PROVIDER_OPTIONS, normalizeCloudProvider } from "../constants/cloudProviders";

const REQUIRED_FIELDS = new Set([
  "companyName",
  "orderType",
  "status",
  "productSubscribe",
]);
const isRequired = (f: string) => REQUIRED_FIELDS.has(f);

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
const WithTutorTooltip = ({
  children,
  text,
  position = "top",
  wrapperClass = "w-full",
  componentName,
}: {
  children: React.ReactNode;
  text?: string;
  position?: "top" | "bottom" | "left" | "right";
  wrapperClass?: string;
  componentName?: string;
}) => {
  if (!text) return <>{children}</>;

  return (
    <TutorTooltip
      text={text}
      position={position}
      wrapperClass={wrapperClass}
      componentName={componentName}
    >
      {children}
    </TutorTooltip>
  );
};

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
  tooltip,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  tooltip?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <WithTutorTooltip text={tooltip} position="bottom">
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
  </WithTutorTooltip>
);

const SelectGroup = ({
  label,
  options,
  required = false,
  tooltip,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  required?: boolean;
  tooltip?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) => (
  <WithTutorTooltip text={tooltip} position="bottom">
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
  </WithTutorTooltip>
);

const ToggleGroup = ({
  label,
  options,
  tooltip,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  tooltip?: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <WithTutorTooltip text={tooltip} position="bottom" wrapperClass="w-fit">
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
  </WithTutorTooltip>
);

const SegmentedControl = ({
  label,
  options,
  tooltip,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  tooltip?: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <WithTutorTooltip text={tooltip} position="bottom">
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
  </WithTutorTooltip>
);

const SectionHeader = ({ title, tooltip }: { title: string; tooltip?: string }) => (
  <WithTutorTooltip text={tooltip} position="bottom">
    <div className="flex items-center gap-3 mb-6">
      <span className={`label-text ${SECONDARY_TEXT} shrink-0`}>{title}</span>
      <div className={`flex-1 h-px bg-[#eee9df]`} />
    </div>
  </WithTutorTooltip>
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
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
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
  onPreProvisionToggle: (v: boolean) => void;
  isCloudChekrReminder: boolean;
  onCloudChekrReminderToggle: (v: boolean) => void;
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
  onPreProvisionToggle,
  isCloudChekrReminder,
  onCloudChekrReminderToggle,
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
      <WithTutorTooltip
        text="Start with the order identifiers, status, type, dates, and amount that define the order record."
        position="bottom"
        wrapperClass="flex-1 min-w-0"
      >
        <div className="flex items-center gap-3">
          <span className={`label-text ${SECONDARY_TEXT} shrink-0`}>
            ORDER INFORMATION
          </span>
          <div className="flex-1 h-px bg-[#eee9df]" />
        </div>
      </WithTutorTooltip>
      <div className="ml-6 flex shrink-0 flex-wrap items-center justify-end gap-4">
        <TutorTooltip
          text="Use this when preparing a CloudChekr reminder. It fills the same TBC defaults, leaves Service Type blank, and selects AWS."
          position="left"
          wrapperClass="shrink-0"
        >
          <label
            className={`flex cursor-pointer items-center gap-2.5 text-sm font-medium ${TERTIARY_TEXT} whitespace-nowrap`}
          >
            <input
              type="checkbox"
              checked={isCloudChekrReminder}
              onChange={(e) => onCloudChekrReminderToggle(e.target.checked)}
              className="h-4 w-4 rounded border-[#dad4c8] text-[#094cb2] focus:ring-[#094cb2]/20"
            />
            CloudChekr Reminder?
          </label>
        </TutorTooltip>
        <TutorTooltip
          text="Check this box if you are creating an account before receiving an official Service No. This will pre-fill many fields with 'TBC'."
          position="left"
          wrapperClass="shrink-0"
        >
          <button
            type="button"
            onClick={() => onPreProvisionToggle(!isPreProvision)}
            className="flex items-center gap-2.5 shrink-0"
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
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <InputGroup
        label="Service No."
        placeholder="e.g. CL549486"
        tooltip="Enter the official service number for this order. For pre-provision orders, this can stay as TBC until issued."
        value={serviceNo}
        onChange={(e) => setServiceNo(e.target.value)}
      />
      <SelectGroup
        label="Status"
        options={STATUS_OPTIONS}
        required={isRequired("status")}
        tooltip="Choose the current processing state. This status appears in order tracking and registry views."
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
        tooltip="Describe the commercial or technical service type, such as a new subscription, offset amount, or service change."
        value={serviceType}
        onChange={(e) => setServiceType(e.target.value)}
      />
      <InputGroup
        label="OASIS Number"
        placeholder="e.g. CB23-00007546\1"
        tooltip="Record the OASIS reference used to trace this order back to the source order document."
        value={oasisNumber}
        onChange={(e) => setOasisNumber(e.target.value)}
      />
      <InputGroup
        label="Project Name"
        placeholder="e.g. Project Alpha"
        tooltip="Optional project or subscription name used to identify the customer workload."
        value={subName}
        onChange={(e) => setSubName(e.target.value)}
      />

      <InputGroup
        label="Order Receive Date"
        type="date"
        tooltip="Set the date the order was received by the team."
        value={orderReceiveDate}
        onChange={(e) => setOrderReceiveDate(e.target.value)}
      />
      <InputGroup
        label="SRD"
        type="date"
        required={isRequired("srd")}
        tooltip="Set the requested service ready date for provisioning and follow-up planning."
        value={srd}
        onChange={(e) => setSrd(e.target.value)}
      />
      <InputGroup
        label="CxS Complete Date"
        type="date"
        tooltip="Set the date CxS completed the provisioning or order handling work."
        value={cxsCompleteDate}
        onChange={(e) => setCxsCompleteDate(e.target.value)}
      />

      <InputGroup
        label="Amount"
        type="number"
        placeholder="0.00"
        tooltip="Enter the order amount for reporting and registry totals."
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
    <SectionHeader
      title="CUSTOMER INFORMATION"
      tooltip="Select or create the customer record and capture the contacts used for provisioning communication."
    />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div className="md:col-span-2">
        <TutorTooltip
          text="Search for an existing customer or type a company name to create a new customer record when the order is saved."
          position="bottom"
        >
          <CustomerCombobox
            value={companyName}
            onChange={(name, id) => {
              setCompanyName(name);
              setCustomerId(id);
            }}
          />
        </TutorTooltip>
      </div>
      <InputGroup
        label="Contact Person"
        placeholder="e.g. Don Ng"
        tooltip="Enter the main customer contact for this order."
        value={contactPerson}
        onChange={(e) => setContactPerson(e.target.value)}
      />
      <InputGroup
        label="Contact No."
        placeholder="e.g. 67594210"
        tooltip="Enter the primary phone number for order or provisioning follow-up."
        value={contactNo}
        onChange={(e) => setContactNo(e.target.value)}
      />
      <div className="md:col-span-2">
        <InputGroup
          label="Contact Email"
          type="email"
          placeholder="email@example.com"
          tooltip="Enter the primary email for provisioning updates and customer communication."
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </div>
      <InputGroup
        label="2nd Contact No."
        placeholder="e.g. 67594210"
        tooltip="Optional backup phone number if the primary contact is unavailable."
        value={contactNo2}
        onChange={(e) => setContactNo2(e.target.value)}
      />
      <div className="md:col-span-2">
        <InputGroup
          label="2nd Contact Email"
          type="email"
          placeholder="email@example.com"
          tooltip="Optional backup email address for order communication."
          value={contactEmail2}
          onChange={(e) => setContactEmail2(e.target.value)}
        />
      </div>
      <TutorTooltip
        text="Enter the billing address that should be associated with this order and customer record."
        position="bottom"
        wrapperClass="md:col-span-3"
      >
        <div className="space-y-1.5">
          <FieldLabel text="Billing Address" />
          <textarea
            className={`w-full px-4 py-2.5 ${OAT_BG} border ${OAT_BORDER} rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(20,110,245)]/20 focus:border-[rgb(20,110,245)] transition-all min-h-[80px] text-sm text-black placeholder:${SECONDARY_TEXT} resize-none`}
            placeholder="Enter full billing address"
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
          />
        </div>
      </TutorTooltip>
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
  onServiceAccountSelect: (id: string, sa: import("../services/serviceAccountService").ServiceAccount | null) => void;
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
  onServiceAccountSelect,
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
    <SectionHeader
      title="CLOUD SERVICE DETAILS"
      tooltip="Choose the cloud provider and record the account identifiers needed to link the order to a service account."
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="md:col-span-2">
        <SelectGroup
          label="Product Subscribe"
          options={CLOUD_PROVIDER_OPTIONS}
          required={isRequired("productSubscribe")}
          tooltip="Choose the cloud provider for this order. Changing provider clears the account fields so the correct identifiers can be entered."
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

      {productSubscribe === "AWS" && (
        <>
          <InputGroup
            label="Billing Account / Master Account"
            placeholder="e.g. 7.59168E+11"
            tooltip="Enter the AWS payer or master account ID when it differs from the root account."
            value={billingAccount}
            onChange={(e) => setBillingAccount(e.target.value)}
          />
          <TutorTooltip
            text="Search for an existing AWS account or enter the root account ID to create a linked service account when saved."
            position="bottom"
          >
            <ServiceAccountCombobox
              label="Account ID / Root ID"
              placeholder="e.g. 74430167128"
              value={accountId}
              provider="AWS"
              onChange={onServiceAccountSelect}
            />
          </TutorTooltip>
          <InputGroup
            label="Account Name / Cloud Checker Name"
            placeholder="e.g. CL545725"
            tooltip="Enter the friendly account name shown in account and cloud checker records."
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
          <InputGroup
            label="Account Login Email"
            type="email"
            placeholder="admin@example.com"
            tooltip="Enter the administrator login email for the cloud account."
            value={accountLoginEmail}
            onChange={(e) => setAccountLoginEmail(e.target.value)}
          />
        </>
      )}
      {productSubscribe === "Alibaba" && (
        <>
          <TutorTooltip
            text="Search for an existing Alibaba account or enter the UID to create a linked service account when saved."
            position="bottom"
          >
            <ServiceAccountCombobox
              label="UID"
              placeholder="e.g. 5.04886E+15"
              value={accountId}
              provider="Alibaba"
              onChange={onServiceAccountSelect}
            />
          </TutorTooltip>
          <InputGroup
            label="Admin Email"
            type="email"
            placeholder="admin@example.com"
            tooltip="Enter the administrator email for this Alibaba account."
            value={accountLoginEmail}
            onChange={(e) => setAccountLoginEmail(e.target.value)}
          />
        </>
      )}
      {productSubscribe === "Azure" && (
        <>
          <TutorTooltip
            text="Search for an existing Azure tenant or enter the tenant ID to create a linked service account when saved."
            position="bottom"
          >
            <ServiceAccountCombobox
              label="Tenant ID"
              placeholder="e.g. 3d44d6b3-5212-4b12-b3ed-83f62ba12194"
              value={accountId}
              provider="Azure"
              onChange={onServiceAccountSelect}
            />
          </TutorTooltip>
          <InputGroup
            label="Azure Subscription ID"
            placeholder="e.g. 807a0e4b-1c78-4f9b-aeea-1a8f5765f128"
            tooltip="Enter the Azure subscription ID associated with this order."
            value={billingAccount}
            onChange={(e) => setBillingAccount(e.target.value)}
          />
          <InputGroup
            label="Primary Domain"
            placeholder="e.g. example.onmicrosoft.com"
            tooltip="Enter the primary Microsoft tenant domain for this Azure account."
            value={azurePrimaryDomain}
            onChange={(e) => setAzurePrimaryDomain(e.target.value)}
          />
          <InputGroup
            label="Admin Email"
            type="email"
            placeholder="admin@example.onmicrosoft.com"
            tooltip="Enter the Azure administrator login email."
            value={accountLoginEmail}
            onChange={(e) => setAccountLoginEmail(e.target.value)}
          />
        </>
      )}
      {productSubscribe === "Huawei" && (
        <>
          <TutorTooltip
            text="Search for an existing Huawei account or enter the Huawei ID to create a linked service account when saved."
            position="bottom"
          >
            <ServiceAccountCombobox
              label="Huawei ID"
              placeholder="e.g. ccfb8a2e45374b78860fcfb72194e573"
              value={accountId}
              provider="Huawei"
              onChange={onServiceAccountSelect}
            />
          </TutorTooltip>
          <InputGroup
            label="Login Email"
            type="email"
            placeholder="admin@example.com"
            tooltip="Enter the Huawei login email for account access."
            value={accountLoginEmail}
            onChange={(e) => setAccountLoginEmail(e.target.value)}
          />
        </>
      )}
      {productSubscribe === "GCP" && (
        <>
          <TutorTooltip
            text="Search for an existing GCP billing account or enter the billing account ID to create a linked service account when saved."
            position="bottom"
          >
            <ServiceAccountCombobox
              label="Billing Account ID"
              placeholder="e.g. 013933-F2938A-CC207B"
              value={accountId}
              provider="GCP"
              onChange={onServiceAccountSelect}
            />
          </TutorTooltip>
          <InputGroup
            label="Admin Email"
            type="email"
            placeholder="admin@example.com"
            tooltip="Enter the GCP administrator email for account access."
            value={accountLoginEmail}
            onChange={(e) => setAccountLoginEmail(e.target.value)}
          />
        </>
      )}
      {productSubscribe === "Tencent" && (
        <>
          <TutorTooltip
            text="Search for an existing Tencent tenant or enter the tenant ID to create a linked service account when saved."
            position="bottom"
          >
            <ServiceAccountCombobox
              label="Tenant ID"
              placeholder="e.g. 200019722598"
              value={accountId}
              provider="Tencent"
              onChange={onServiceAccountSelect}
            />
          </TutorTooltip>
          <InputGroup
            label="Login Email"
            type="email"
            placeholder="admin@example.com"
            tooltip="Enter the Tencent login email for account access."
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
            tooltip="Enter the cloud account password only when it is required for operational handover."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TutorTooltip
            text="Use this area for extra account identifiers, domains, notes, or access details that do not fit the provider-specific fields."
            position="bottom"
            wrapperClass="md:col-span-2"
          >
            <div className="space-y-1.5">
              <FieldLabel text="Other Account Information" />
              <textarea
                className={`w-full px-4 py-2.5 ${OAT_BG} border ${OAT_BORDER} rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(20,110,245)]/20 focus:border-[rgb(20,110,245)] transition-all min-h-[80px] text-sm text-black placeholder:${SECONDARY_TEXT} resize-none`}
                placeholder="Domain names, additional IDs, etc."
                value={otherAccountInfo}
                onChange={(e) => setOtherAccountInfo(e.target.value)}
              />
            </div>
          </TutorTooltip>
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
    <SectionHeader
      title="PROVISIONING & TRACKING"
      tooltip="Capture internal provisioning references, ownership, and follow-up links used after the order is created."
    />

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <InputGroup
        label="CxS Request No."
        placeholder="e.g. RN822908/1-2"
        tooltip="Enter the CxS request number used to track provisioning activity."
        value={cxsRequestNo}
        onChange={(e) => setCxsRequestNo(e.target.value)}
      />
      <InputGroup
        label="TID"
        placeholder="e.g. 103690"
        tooltip="Enter the TID reference associated with this provisioning request."
        value={tid}
        onChange={(e) => setTid(e.target.value)}
      />
      <InputGroup
        label="SD Number"
        placeholder="e.g. SD11652876"
        tooltip="Enter the service desk number used for internal tracking."
        value={sdNumber}
        onChange={(e) => setSdNumber(e.target.value)}
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5">
      <ToggleGroup
        label="PS Job"
        options={["Y", "N"]}
        tooltip="Mark whether this order requires a PS job."
        value={psJob}
        onChange={setPsJob}
      />
      <ToggleGroup
        label="Welcome Letter"
        options={["Yes", "No"]}
        tooltip="Track whether the customer welcome letter is required or has been handled."
        value={welcomeLetter}
        onChange={setWelcomeLetter}
      />
      <SegmentedControl
        label="T2 / T3"
        options={["T1", "T2", "T3", "N/A"]}
        tooltip="Choose the support tier classification for this order when applicable."
        value={t2t3}
        onChange={setT2t3}
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
      <InputGroup
        label="Handled By"
        placeholder="e.g. Kilson, Helen, Hin"
        tooltip="Enter the teammate responsible for handling this order."
        value={by}
        onChange={(e) => setBy(e.target.value)}
      />
      <div className="md:col-span-2">
        <InputGroup
          label="Order Form URL"
          placeholder="http://10.10.10.209/OASIS_FILE_MANAGER/..."
          tooltip="Paste the source order form URL so the team can open the original order document."
          value={orderFormUrl}
          onChange={(e) => setOrderFormUrl(e.target.value)}
        />
      </div>
      <InputGroup
        label="Case ID"
        placeholder="e.g. CASE-123456"
        tooltip="Enter the external or internal case ID related to this order."
        value={caseId}
        onChange={(e) => setCaseId(e.target.value)}
      />
      <div className="md:col-span-2">
        <InputGroup
          label="Case ID URL"
          placeholder="https://…"
          tooltip="Paste the case link so the team can open the related support or workflow record."
          value={caseIdUrl}
          onChange={(e) => setCaseIdUrl(e.target.value)}
        />
      </div>
      <TutorTooltip
        text="Use remarks for timeline notes, provisioning updates, special handling instructions, or blockers."
        position="bottom"
        wrapperClass="md:col-span-3"
      >
        <div className="space-y-1.5">
          <FieldLabel text="Remark" />
          <textarea
            className={`w-full px-4 py-2.5 ${OAT_BG} border ${OAT_BORDER} rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(20,110,245)]/20 focus:border-[rgb(20,110,245)] transition-all min-h-[120px] text-sm text-black placeholder:${SECONDARY_TEXT} resize-none`}
            placeholder="Enter timeline, log updates, or special instructions..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>
      </TutorTooltip>
    </div>
  </div>
);

// ─── Page Component ───────────────────────────────────────────────────────────
const NewOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userEmail } = usePermission();

  const [activeSection, setActiveSection] = useState<number>(0);

  const [isPreProvision, setIsPreProvision] = useState(false);
  const [isCloudChekrReminder, setIsCloudChekrReminder] = useState(false);
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
  const [selectedSaId, setSelectedSaId] = useState<number | null>(null);
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

  useEffect(() => {
    const customerIdParam = searchParams.get("customerId");
    if (!customerIdParam) return;

    const id = Number(customerIdParam);
    if (!Number.isFinite(id)) return;

    customerService
      .findById(id)
      .then((customer) => {
        setCustomerId(customer.id);
        setCompanyName(customer.Company || customer.Title || "");
        setContactPerson(customer.ContactPerson || customer.Title || "");
        setContactNo(customer.Phone || "");
        setContactEmail(customer.Email || "");
        setBillingAddress(customer.BillingAddress || "");
      })
      .catch(() => {
        setCustomerId(id);
      });
  }, [searchParams]);

  const applyTbcDefaults = (serviceTypeValue: string) => {
    // 1. Status default to "Pending for order issued"
    setStatus("Pending for order issued");
    // 2. Order Type default to "New Install"
    setOrderType("New Install");

    // 3. Pre-fill "TBC" for text fields
    setServiceNo("TBC");
    setServiceType(serviceTypeValue);
    setOasisNumber("TBC");
    setSubName("TBC");
    setContactPerson("TBC");
    setContactNo("TBC");
    setContactEmail("TBC");
    setContactNo2("TBC");
    setContactEmail2("TBC");
    setBillingAddress("TBC");
    setBillingAccount("TBC");
    setAccountName("TBC");
    setAccountLoginEmail("TBC");
    setAzurePrimaryDomain("TBC");
    setPassword("TBC");
    setOtherAccountInfo("TBC");
    setCxsRequestNo("TBC");
    setTid("TBC");
    setSdNumber("TBC");
    setOrderFormUrl("TBC");

    // Fields to leave blank: productSubscribe, companyName, accountId, by, caseId, caseIdUrl, remark
  };

  const clearTbcDefaults = () => {
    setServiceNo("");
    setStatus("");
    setOrderType("");
    setServiceType("");
    setOasisNumber("");
    setSubName("");
    setContactPerson("");
    setContactNo("");
    setContactEmail("");
    setContactNo2("");
    setContactEmail2("");
    setBillingAddress("");
    setBillingAccount("");
    setAccountName("");
    setAccountLoginEmail("");
    setAzurePrimaryDomain("");
    setPassword("");
    setOtherAccountInfo("");
    setCxsRequestNo("");
    setTid("");
    setSdNumber("");
    setOrderFormUrl("");
  };

  const handlePreProvisionToggle = (val: boolean) => {
    setIsPreProvision(val);
    if (val) {
      setIsCloudChekrReminder(false);
      applyTbcDefaults("Pre-Provision");
    } else {
      clearTbcDefaults();
    }
  };

  const handleCloudChekrReminderToggle = (val: boolean) => {
    setIsCloudChekrReminder(val);
    if (val) {
      setIsPreProvision(false);
      resetCloudAccountFields();
      applyTbcDefaults("");
      setProductSubscribe("AWS");
    } else {
      clearTbcDefaults();
      setProductSubscribe("");
      resetCloudAccountFields();
    }
  };

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

    setSubmitting(true);
    setSubmitError(null);

    try {
      const cloudProvider = normalizeCloudProvider(productSubscribe);
      const title = isPreProvision ? "TBC" : serviceNo;

      let resolvedCustomerId = customerId;
      if (!resolvedCustomerId) {
        const resolved = await resolveOrCreateCustomer(
          companyName,
          userEmail,
          undefined,
          {
            Email: contactEmail || "",
            Phone: contactNo || "",
            ContactPerson: contactPerson || undefined,
          },
        );
        resolvedCustomerId = resolved.id;
      }

      // Resolve SA: user may have selected an existing one (selectedSaId) or typed a new ID.
      let saId: number | undefined = selectedSaId ?? undefined;
      if (!saId && productSubscribe && accountId.trim()) {
        try {
          const resolved = await resolveOrCreateServiceAccount(
            accountId,
            cloudProvider,
            userEmail,
            undefined,
            {
              Title: title,
              CustomerIDId: resolvedCustomerId ?? undefined,
              AccountName: accountName || undefined,
              Domain: azurePrimaryDomain || undefined,
              LoginEmail: accountLoginEmail || undefined,
              Password: password || undefined,
              PrimaryAccountID: billingAccount || undefined,
              OtherAccountInfo: otherAccountInfo || undefined,
            },
          );
          saId = resolved.id;
        } catch (e) {
          if (orderType === "Termination") throw e;
          // For non-Termination orders, SA resolution failure is non-blocking
        }
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
          SAId: saId,
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
          CloudChekr_Reminder: isCloudChekrReminder,
        },
        userEmail,
      );

      if (orderType === "Termination" && saId) {
        await serviceAccountService.update(saId, {
          AccountStatus: "Terminated",
          ...(billingAccount && { PrimaryAccountID: billingAccount }),
          ...(accountId && { SecondaryID: accountId }),
          ...(accountName && { AccountName: accountName }),
          ...(azurePrimaryDomain && { Domain: azurePrimaryDomain }),
          ...(accountLoginEmail && { LoginEmail: accountLoginEmail }),
          ...(password && { Password: password }),
          ...(otherAccountInfo && { OtherAccountInfo: otherAccountInfo }),
        }, userEmail);
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
    setSelectedSaId(null);
    setBillingAccount("");
    setAccountName("");
    setAccountLoginEmail("");
    setAzurePrimaryDomain("");
    setPassword("");
    setOtherAccountInfo("");
  };

  const handleServiceAccountSelect = (id: string, sa: import("../services/serviceAccountService").ServiceAccount | null) => {
    setAccountId(id);
    setSelectedSaId(sa ? sa.id : null);
    if (sa) {
      setBillingAccount(sa.PrimaryAccountID ?? "");
      setAccountName(sa.AccountName ?? "");
      setAccountLoginEmail(sa.LoginEmail ?? "");
      setAzurePrimaryDomain(sa.Domain ?? "");
      setPassword(sa.Password ?? "");
      setOtherAccountInfo(sa.OtherAccountInfo ?? "");
    }
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
          <TutorTooltip
            text="Return to the orders list without saving this new order."
            position="bottom"
            wrapperClass="w-fit"
          >
            <Link
              to="/orders"
              className={`p-2 ${OAT_BG} border ${OAT_BORDER} rounded-lg hover:bg-white transition-colors block`}
            >
              <ArrowLeft className={`w-4 h-4 ${TERTIARY_TEXT}`} />
            </Link>
          </TutorTooltip>
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
            zIndex: 10,
            boxShadow:
              "rgba(0,0,0,0.06) 0px 1px 2px, rgba(0,0,0,0.04) 0px -1px 1px inset",
          }}
        >
          <p className={`label-text ${SECONDARY_TEXT} px-3 pt-1 pb-2`}>
            SECTIONS
          </p>
          <div className="space-y-0.5">
            {SECTION_LABELS.map((label, i) => (
              <TutorTooltip
                key={label}
                text={`Open the ${label.toLowerCase()} section. The dot shows when the main fields for this step have been filled.`}
                position="right"
              >
                <NavItem
                  index={i}
                  label={label}
                  active={activeSection === i}
                  complete={sectionComplete[i]}
                  onClick={(): void => setActiveSection(i)}
                />
              </TutorTooltip>
            ))}
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {activeSection === 0 && (
            <OrderInfoSection
              isPreProvision={isPreProvision}
              onPreProvisionToggle={handlePreProvisionToggle}
              isCloudChekrReminder={isCloudChekrReminder}
              onCloudChekrReminderToggle={handleCloudChekrReminderToggle}
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
              onServiceAccountSelect={handleServiceAccountSelect}
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
