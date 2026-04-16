import React, { useState } from "react";
import {
  Search,
  Filter,
  Mail,
  Phone,
  MoreHorizontal,
  Eye,
  X,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { TutorTooltip } from "../components/TutorTooltip";
import {
  customerService,
  Customer,
  CreateCustomerInput,
} from "../services/customerService";
import { usePermission } from "../contexts/PermissionContext";
import { useCustomers, useInvalidateCustomers } from "../services/useOrdersQuery";

const EMPTY_FORM: CreateCustomerInput = {
  Title: "",
  Email: "",
  Phone: "",
  Company: "",
  Status: "Active",
  Tier: "Standard",
  SpecialNotes: "",
};

const inputClass =
  "w-full px-3 py-2 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all";

const Customers = () => {
  const { userEmail } = usePermission();
  const { data, isLoading: loading, isError } = useCustomers();
  const invalidateCustomers = useInvalidateCustomers();
  const customers: Customer[] = Array.isArray(data) ? data : [];
  const error = isError ? "Failed to load customers. Please try again." : null;
  const [searchQuery, setSearchQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateCustomerInput>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (field: keyof CreateCustomerInput, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAddCustomer = async () => {
    if (!form.Title.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!form.Company.trim()) {
      setFormError("Company is required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await customerService.create(form, userEmail);
      invalidateCustomers();
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch {
      setFormError("Failed to create customer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = customers.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.Title ?? "").toLowerCase().includes(q) ||
      (c.Email ?? "").toLowerCase().includes(q) ||
      (c.Phone ?? "").includes(q) ||
      (c.Company ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[28px] font-semibold text-[#1d1d1f]"
            style={{ letterSpacing: "-0.28px", lineHeight: "1.1" }}
          >
            Customers
          </h1>
          <p className="text-sm text-[#1d1d1f]/50 mt-1">
            Manage your customer database and view their history.
          </p>
        </div>
        <TutorTooltip
          text="Click here to add a new customer to the database."
          position="bottom"
        >
          <button
            onClick={() => setShowModal(true)}
            className="gradient-cta px-5 py-2 rounded-lg font-medium text-sm shadow-sm"
          >
            Add Customer
          </button>
        </TutorTooltip>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[#1d1d1f]/06 flex justify-between items-center bg-[#f5f5f7]/60">
          <TutorTooltip
            text="Search for a customer by their name, ID, email, or phone number."
            position="bottom"
            wrapperClass="relative"
          >
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#1d1d1f]/30" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-white border border-[#1d1d1f]/08 rounded-lg text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 w-64 transition-all"
              />
            </div>
          </TutorTooltip>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#1d1d1f]/70 bg-white border border-[#1d1d1f]/08 rounded-lg hover:bg-[#f5f5f7] transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1d1d1f]/06">
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35">
                  Customer
                </th>
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35">
                  Contact
                </th>
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35">
                  Orders
                </th>
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35">
                  Total Spent
                </th>
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35">
                  Status
                </th>
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-[#1d1d1f]/30 text-sm"
                  >
                    Loading customers…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-red-500 text-sm"
                  >
                    {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-[#1d1d1f]/30 text-sm"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-[#1d1d1f]/04 hover:bg-[#f5f5f7] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-[#0071e3] flex items-center justify-center font-semibold text-xs">
                          {(customer.Title || customer.Company || "??")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <TutorTooltip
                          text="Click the customer name to view their detailed profile, including order history and special notes."
                          position="right"
                        >
                          <div>
                            <Link
                              to={`/customers/${customer.id}`}
                              className="text-sm font-medium text-[#0071e3] hover:underline"
                            >
                              {customer.Title ||
                                customer.Company ||
                                `Customer #${customer.id}`}
                            </Link>
                            <div className="text-xs text-[#1d1d1f]/35">
                              #{customer.id}
                            </div>
                          </div>
                        </TutorTooltip>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-[#1d1d1f]/60">
                          <Mail className="w-3 h-3 text-[#1d1d1f]/30" />
                          {customer.Email}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#1d1d1f]/60">
                          <Phone className="w-3 h-3 text-[#1d1d1f]/30" />
                          {customer.Phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#1d1d1f]/30 text-sm">—</td>
                    <td className="px-6 py-4 text-[#1d1d1f]/30 text-sm">—</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          customer.Status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {customer.Status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/customers/${customer.id}`}
                          className="p-1.5 text-[#1d1d1f]/35 hover:text-[#0071e3] hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button className="p-1.5 text-[#1d1d1f]/35 hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1d1d1f]/06">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">
                Add Customer
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm(EMPTY_FORM);
                  setFormError(null);
                }}
                className="p-1.5 rounded-lg hover:bg-[#f5f5f7] text-[#1d1d1f]/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="label-text text-[#1d1d1f]/45">Name *</label>
                  <input
                    className={inputClass}
                    value={form.Title}
                    onChange={(e) => set("Title", e.target.value)}
                    placeholder="Contact name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="label-text text-[#1d1d1f]/45">
                    Company *
                  </label>
                  <input
                    className={inputClass}
                    value={form.Company}
                    onChange={(e) => set("Company", e.target.value)}
                    placeholder="Company name"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="label-text text-[#1d1d1f]/45">Email</label>
                <input
                  type="email"
                  className={inputClass}
                  value={form.Email}
                  onChange={(e) => set("Email", e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="label-text text-[#1d1d1f]/45">Phone</label>
                <input
                  className={inputClass}
                  value={form.Phone}
                  onChange={(e) => set("Phone", e.target.value)}
                  placeholder="+852 1234 5678"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="label-text text-[#1d1d1f]/45">Status</label>
                  <select
                    className={inputClass}
                    value={form.Status}
                    onChange={(e) => set("Status", e.target.value)}
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="label-text text-[#1d1d1f]/45">Tier</label>
                  <select
                    className={inputClass}
                    value={form.Tier}
                    onChange={(e) => set("Tier", e.target.value)}
                  >
                    <option>Standard</option>
                    <option>Premium</option>
                    <option>Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="label-text text-[#1d1d1f]/45">
                  Special Notes
                </label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={3}
                  value={form.SpecialNotes}
                  onChange={(e) => set("SpecialNotes", e.target.value)}
                  placeholder="Any special instructions…"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#1d1d1f]/06 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm(EMPTY_FORM);
                  setFormError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-[#1d1d1f]/60 bg-[#f5f5f7] rounded-lg hover:bg-[#e5e5e7] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium gradient-cta rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving…" : "Save Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
