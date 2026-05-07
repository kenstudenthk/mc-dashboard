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
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { TutorTooltip } from "../components/TutorTooltip";
import {
  customerService,
  Customer,
  CreateCustomerInput,
} from "../services/customerService";
import { usePermission } from "../contexts/PermissionContext";
import {
  useCustomers,
  useInvalidateCustomers,
  useOrders,
} from "../services/useOrdersQuery";

const EMPTY_FORM: CreateCustomerInput = {
  Title: "",
  Email: "",
  Phone: "",
  Company: "",
  PreviousName: "",
  Status: "Active",
  Tier: "Standard",
  SpecialNotes: "",
};

const inputClass =
  "w-full px-3 py-2 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all";

const Customers = () => {
  const { userEmail } = usePermission();
  const { data, isLoading: loading, isError } = useCustomers();
  const { data: ordersData } = useOrders();
  const invalidateCustomers = useInvalidateCustomers();
  const customers: Customer[] = Array.isArray(data) ? data : [];
  const orders = Array.isArray(ordersData) ? ordersData : [];
  const error = isError ? "Failed to load customers. Please try again." : null;
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");
  const [contactFilter, setContactFilter] = useState("All");
  const [relationshipFilter, setRelationshipFilter] = useState("All");

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

  const orderCountByCustomer = orders.reduce<Record<number, number>>((acc, order) => {
    const id = Number(order.CustomerID);
    if (Number.isFinite(id) && id > 0) acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  const activeFilterCount = [
    statusFilter !== "All",
    tierFilter !== "All",
    contactFilter !== "All",
    relationshipFilter !== "All",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setStatusFilter("All");
    setTierFilter("All");
    setContactFilter("All");
    setRelationshipFilter("All");
  };

  const filtered = [...customers]
    .sort((a, b) => b.id - a.id)
    .filter((c) => {
      if (statusFilter !== "All" && c.Status !== statusFilter) return false;
      if (tierFilter !== "All" && (c.Tier ?? "Standard") !== tierFilter) {
        return false;
      }
      if (contactFilter === "Missing Email" && c.Email?.trim()) return false;
      if (contactFilter === "Missing Phone" && c.Phone?.trim()) return false;
      if (
        relationshipFilter === "With Orders" &&
        !orderCountByCustomer[c.id]
      ) {
        return false;
      }
      if (
        relationshipFilter === "No Orders" &&
        orderCountByCustomer[c.id]
      ) {
        return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          String(c.id).includes(q) ||
          (c.Title ?? "").toLowerCase().includes(q) ||
          (c.PreviousName ?? "").toLowerCase().includes(q) ||
          (c.Email ?? "").toLowerCase().includes(q) ||
          (c.Phone ?? "").includes(q) ||
          (c.Company ?? "").toLowerCase().includes(q) ||
          (c.Tier ?? "").toLowerCase().includes(q) ||
          (c.Status ?? "").toLowerCase().includes(q)
        );
      }

      return true;
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
          componentName="Customers.AddButton"
        >
          <button
            onClick={() => setShowModal(true)}
            className="gradient-cta inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </TutorTooltip>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#dad4c8] bg-[#faf9f7] p-4 lg:flex-row lg:items-center lg:justify-between">
          <TutorTooltip
            text="Search for a customer by their name, ID, email, or phone number."
            position="bottom"
            wrapperClass="relative"
            componentName="Customers.SearchFilter"
          >
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#1d1d1f]/30" />
              <input
                type="text"
                placeholder="Search customers, company, email, phone, status, or tier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#dad4c8] bg-white py-2 pl-9 pr-4 text-sm text-[#1d1d1f] transition-all placeholder:text-[#1d1d1f]/30 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 lg:w-[28rem]"
              />
            </div>
          </TutorTooltip>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#dad4c8] bg-white px-3 py-2 text-sm font-semibold text-[#55534e] transition-colors hover:bg-[#f5f5f7]"
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-black px-1.5 py-0.5 text-[10px] leading-none text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-end gap-3 border-b border-[#dad4c8] bg-white p-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#dad4c8] bg-[#faf9f7] px-3 py-2 text-sm"
              aria-label="Filter by status"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="rounded-lg border border-[#dad4c8] bg-[#faf9f7] px-3 py-2 text-sm"
              aria-label="Filter by tier"
            >
              <option value="All">All Tiers</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="Enterprise">Enterprise</option>
            </select>
            <select
              value={contactFilter}
              onChange={(e) => setContactFilter(e.target.value)}
              className="rounded-lg border border-[#dad4c8] bg-[#faf9f7] px-3 py-2 text-sm"
              aria-label="Filter by missing contact details"
            >
              <option value="All">All Contact Records</option>
              <option value="Missing Email">Missing Email</option>
              <option value="Missing Phone">Missing Phone</option>
            </select>
            <select
              value={relationshipFilter}
              onChange={(e) => setRelationshipFilter(e.target.value)}
              className="rounded-lg border border-[#dad4c8] bg-[#faf9f7] px-3 py-2 text-sm"
              aria-label="Filter by order relationship"
            >
              <option value="All">All Relationships</option>
              <option value="With Orders">With Orders</option>
              <option value="No Orders">No Orders</option>
            </select>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="rounded-lg border border-[#dad4c8] bg-white px-3 py-2 text-xs font-semibold text-[#55534e] hover:bg-[#f5f5f7]"
              >
                Clear All
              </button>
            )}
            <span className="ml-auto text-xs font-semibold text-[#9f9b93]">
              {filtered.length} results
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="hidden h-11 border-b border-[#dad4c8] bg-[#f5f3ef] md:table-row">
                <th className="px-6 py-3.5 text-xs font-semibold text-[#55534e]">
                  Customer
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-[#55534e]">
                  Contact
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-[#55534e]">
                  Orders
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-[#55534e]">
                  Tier
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-[#55534e]">
                  Status
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-[#55534e]">
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
                  <React.Fragment key={customer.id}>
                    {/* Mobile Card View */}
                    <tr className="md:hidden border-b border-[#1d1d1f]/04">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="rounded-xl border border-[#1d1d1f]/06 p-3 bg-white flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0071e3] flex items-center justify-center font-bold text-sm shrink-0">
                                {(customer.Title || customer.Company || "??")
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <Link
                                  to={`/customers/${customer.id}`}
                                  className="text-sm font-semibold text-[#0071e3] hover:underline"
                                >
                                  {customer.Title ||
                                    customer.Company ||
                                    `Customer #${customer.id}`}
                                </Link>
                                {customer.PreviousName && (
                                  <div className="mt-0.5 text-xs text-[#1d1d1f]/40">
                                    Previous Name: {customer.PreviousName}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                customer.Status === "Active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {customer.Status}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 bg-[#f5f5f7] p-2.5 rounded-lg">
                            <div className="flex items-center gap-2 text-xs text-[#1d1d1f]/70">
                              <Mail className="w-3.5 h-3.5 text-[#1d1d1f]/40" />
                              <span className="truncate">{customer.Email || "—"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#1d1d1f]/70">
                              <Phone className="w-3.5 h-3.5 text-[#1d1d1f]/40" />
                              <span>{customer.Phone || "—"}</span>
                            </div>
                          </div>

                          <div className="flex items-end justify-between gap-3 pt-1">
                            <span className="text-[10px] leading-none text-[#1d1d1f]/35">
                              ID #{customer.id}
                            </span>
                            <Link
                              to={`/customers/${customer.id}`}
                              className="px-3 py-1.5 text-xs font-medium text-[#0071e3] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Profile
                            </Link>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Desktop Table Row */}
                    <tr
                      className="hidden md:table-row border-b border-[#1d1d1f]/04 hover:bg-[#f5f5f7] transition-colors group"
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
                          componentName="Customers.Table"
                        >
                          <div className="flex min-h-10 flex-col justify-between gap-1">
                            <Link
                              to={`/customers/${customer.id}`}
                              className="text-sm font-medium text-[#0071e3] hover:underline"
                            >
                              {customer.Title ||
                                customer.Company ||
                                `Customer #${customer.id}`}
                            </Link>
                            {customer.PreviousName && (
                              <div className="text-xs text-[#1d1d1f]/40">
                                Previous Name: {customer.PreviousName}
                              </div>
                            )}
                            <div className="text-[10px] leading-none text-[#1d1d1f]/35">
                              ID #{customer.id}
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
                    <td className="px-6 py-4 text-sm font-semibold text-[#1d1d1f]/70">
                      {orderCountByCustomer[customer.id] ?? 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1d1d1f]/60">
                      {customer.Tier ?? "Standard"}
                    </td>
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
                      <div className="flex items-center justify-end gap-1.5 opacity-100 transition-opacity">
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
                  </React.Fragment>
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
                <label className="label-text text-[#1d1d1f]/45">
                  Previous Name
                </label>
                <input
                  className={inputClass}
                  value={form.PreviousName ?? ""}
                  onChange={(e) => set("PreviousName", e.target.value)}
                  placeholder="Previous company name"
                />
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
