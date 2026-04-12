import React, { useState } from "react";
import { ArrowLeft, Save, AlertCircle, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { TutorTooltip } from "../components/TutorTooltip";
import CustomerCombobox from "../components/CustomerCombobox";
import { orderService } from "../services/orderService";
import { customerService } from "../services/customerService";
import { usePermission } from "../contexts/PermissionContext";

const CLOUD_PROVIDER_MAP: Record<string, string> = {
  "AWS (Amazon Web Service)": "AWS",
  "Microsoft Azure": "Azure",
  "Huawei Cloud": "Huawei",
  "Google Cloud Platform (GCP)": "GCP",
  AliCloud: "Alibaba",
  Tencent: "Tencent",
};

const inputClass =
  "w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30";

const InputGroup = ({
  label,
  type = "text",
  placeholder = "",
  disabled = false,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="space-y-1.5">
    <label className="label-text text-[#1d1d1f]/45">{label}</label>
    <input
      type={type}
      disabled={disabled}
      value={value}
      onChange={onChange}
      className={`${inputClass} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      placeholder={placeholder}
    />
  </div>
);

const SelectGroup = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) => (
  <div className="space-y-1.5">
    <label className="label-text text-[#1d1d1f]/45">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all appearance-none text-sm text-[#1d1d1f]"
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const NewOrder = () => {
  const navigate = useNavigate();
  const { userEmail } = usePermission();

  const [isPreProvision, setIsPreProvision] = useState(false);
  const [serviceNo, setServiceNo] = useState("");
  const [status, setStatus] = useState("");
  const [productSubscribe, setProductSubscribe] = useState("");
  const [orderType, setOrderType] = useState("");
  const [srd, setSrd] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");

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

    setSubmitting(true);
    setSubmitError(null);

    try {
      const cloudProvider =
        CLOUD_PROVIDER_MAP[productSubscribe] || productSubscribe;
      const title = isPreProvision ? "TBC" : serviceNo;

      // If no existing customer was selected, auto-create a customer record first
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

      await orderService.create(
        {
          Title: title,
          CustomerName: companyName,
          CustomerID: resolvedCustomerId ?? undefined,
          OrderType: orderType,
          Status: status,
          SRD: srd || undefined,
          CloudProvider: cloudProvider,
          Amount: parseFloat(amount) || 0,
          AccountID: accountId || undefined,
        },
        userEmail,
      );
      setSubmitSuccess(true);
      setTimeout(() => navigate(`/orders/${title}`), 800);
    } catch {
      setSubmitError("Failed to create order. Please try again.");
      setSubmitting(false);
    }
  };

  const sectionHeaderClass =
    "text-[17px] font-semibold text-[#1d1d1f] mb-5 border-b border-[#1d1d1f]/06 pb-4";
  const cardClass = "card p-8";

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/orders"
            className="p-2 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-4.5 h-4.5 text-[#1d1d1f]/60" />
          </Link>
          <div>
            <h1
              className="text-[28px] font-semibold text-[#1d1d1f]"
              style={{ letterSpacing: "-0.28px", lineHeight: "1.1" }}
            >
              Create New Order
            </h1>
            <p className="text-sm text-[#1d1d1f]/50 mt-1">
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
            className="gradient-cta px-5 py-2 rounded-lg font-medium text-sm shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5">
        {/* Order Information */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-5 border-b border-[#1d1d1f]/06 pb-4">
            <h2 className="text-[17px] font-semibold text-[#1d1d1f]">
              Order Information
            </h2>
            <TutorTooltip
              text="Check this box if you are creating an account before receiving an official Service No. The Service No. will be set to 'TBC'."
              position="left"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="preProvision"
                  checked={isPreProvision}
                  onChange={(e) => setIsPreProvision(e.target.checked)}
                  className="w-4 h-4 text-[#0071e3] border-[#1d1d1f]/20 rounded focus:ring-[#0071e3]"
                />
                <label
                  htmlFor="preProvision"
                  className="text-sm font-medium text-[#1d1d1f]/70 cursor-pointer"
                >
                  Pre-Provision Order (No Service No. yet)
                </label>
              </div>
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
              options={[
                "Completed",
                "Account Created",
                "Pending for order issued",
                "Processing",
                "Cancelled",
                "Pending Closure",
                "Pending for other parties",
              ]}
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
                options={[
                  "New Install",
                  "Misc Change",
                  "Contract Renewal",
                  "Termination",
                  "Pre-Pro",
                ]}
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
              />
            </TutorTooltip>
            <InputGroup label="Service Type" placeholder="e.g. Offset Amount" />
            <InputGroup
              label="OASIS Number"
              placeholder="e.g. CB23-00007546\1"
            />
            <InputGroup label="Order Receive Date" placeholder="DD-MMM-YY" />
            <InputGroup
              label="SRD"
              placeholder="DD-MMM-YY"
              value={srd}
              onChange={(e) => setSrd(e.target.value)}
            />
            <InputGroup label="CxS Complete Date" placeholder="DD-MMM-YY" />
            <InputGroup
              label="Amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {orderType === "Termination" && (
            <div className="mt-5 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">
                  Termination Order
                </h3>
                <p className="text-sm text-red-600 mt-1">
                  When this order is saved, any existing active orders matching
                  this Account ID will be automatically marked as Terminated
                  (highlighted in red) in the registry.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Customer Information */}
        <div className={cardClass}>
          <h2 className={sectionHeaderClass}>Customer Information</h2>
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
            <InputGroup label="Contact Person" placeholder="e.g. Don Ng" />
            <InputGroup label="Contact No." placeholder="e.g. 67594210" />
            <div className="md:col-span-2">
              <InputGroup
                label="Contact Email (If have)"
                type="email"
                placeholder="email@example.com"
              />
            </div>
            <div className="md:col-span-3 space-y-1.5">
              <label className="label-text text-[#1d1d1f]/45">
                Billing Address
              </label>
              <textarea
                className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all min-h-[80px] text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30"
                placeholder="Enter full billing address"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Cloud Service Details */}
        <div className={cardClass}>
          <h2 className={sectionHeaderClass}>Cloud Service Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <SelectGroup
                label="Product Subscribe"
                options={[
                  "AWS (Amazon Web Service)",
                  "Microsoft Azure",
                  "Huawei Cloud",
                  "Google Cloud Platform (GCP)",
                  "AliCloud",
                  "Tencent",
                ]}
                value={productSubscribe}
                onChange={(e) => {
                  setProductSubscribe(e.target.value);
                  setAccountId("");
                }}
              />
            </div>

            {productSubscribe === "AWS (Amazon Web Service)" && (
              <>
                <InputGroup
                  label="Billing Account / Master Account"
                  placeholder="e.g. 7.59168E+11"
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
                />
                <InputGroup
                  label="Account Login Email"
                  type="email"
                  placeholder="admin@example.com"
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
                />
                <InputGroup
                  label="Primary Domain"
                  placeholder="e.g. example.onmicrosoft.com"
                />
                <InputGroup
                  label="Admin Email"
                  type="email"
                  placeholder="admin@example.onmicrosoft.com"
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
                />
              </>
            )}

            {!productSubscribe && (
              <div className="md:col-span-2 p-4 bg-[#f5f5f7] rounded-lg border border-[#1d1d1f]/06 text-sm text-[#1d1d1f]/40 text-center">
                Please select a Product Subscribe to view specific fields.
              </div>
            )}

            {productSubscribe && (
              <>
                <InputGroup
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                />
                <div className="md:col-span-2 space-y-1.5">
                  <label className="label-text text-[#1d1d1f]/45">
                    Other Account Information
                  </label>
                  <textarea
                    className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all min-h-[80px] text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30"
                    placeholder="Domain names, additional IDs, etc."
                  ></textarea>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Provisioning & Tracking */}
        <div className={cardClass}>
          <h2 className={sectionHeaderClass}>Provisioning & Tracking</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <InputGroup
              label="CxS Request No."
              placeholder="e.g. RN822908/1-2"
            />
            <InputGroup label="TID" placeholder="e.g. 103690" />
            <InputGroup label="SD Number" placeholder="e.g. SD11652876" />
            <SelectGroup
              label="PS Job (Y/N)"
              options={["Y", "N", "Yes", "No"]}
            />
            <SelectGroup label="T2/ T3" options={["T1", "T2", "T3", "N/A"]} />
            <SelectGroup
              label="Welcome Letter (Yes / No)"
              options={["Yes", "No"]}
            />
            <InputGroup label="By" placeholder="e.g. Kilson, Helen, Hin" />
            <div className="md:col-span-2">
              <InputGroup
                label="Order Form (URL)"
                placeholder="http://10.10.10.209/OASIS_FILE_MANAGER/..."
              />
            </div>
            <div className="md:col-span-3 space-y-1.5">
              <label className="label-text text-[#1d1d1f]/45">Remark</label>
              <textarea
                className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all min-h-[120px] text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30"
                placeholder="Enter timeline, log updates, or special instructions..."
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrder;
