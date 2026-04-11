import React, { useState, useEffect } from "react";
import { Search, Filter, Mail, Phone, MoreHorizontal, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { TutorTooltip } from "../components/TutorTooltip";
import { customerService, Customer } from "../services/customerService";

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    customerService
      .findAll()
      .then(setCustomers)
      .catch(() => setError("Failed to load customers. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.Title.toLowerCase().includes(q) ||
      c.Email.toLowerCase().includes(q) ||
      c.Phone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            Customers
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your customer database and view their history.
          </p>
        </div>
        <TutorTooltip
          text="Click here to add a new customer to the database."
          position="bottom"
        >
          <button className="gradient-cta px-6 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-primary/20">
            Add Customer
          </button>
        </TutorTooltip>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <TutorTooltip
            text="Search for a customer by their name, ID, email, or phone number."
            position="bottom"
            wrapperClass="relative"
          >
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
              />
            </div>
          </TutorTooltip>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 label-text text-gray-400">Customer</th>
                <th className="px-6 py-4 label-text text-gray-400">Contact</th>
                <th className="px-6 py-4 label-text text-gray-400">Orders</th>
                <th className="px-6 py-4 label-text text-gray-400">
                  Total Spent
                </th>
                <th className="px-6 py-4 label-text text-gray-400">Status</th>
                <th className="px-6 py-4 label-text text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    Loading customers…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-sm">
                          {customer.Title.substring(0, 2).toUpperCase()}
                        </div>
                        <TutorTooltip
                          text="Click the customer name to view their detailed profile, including order history and special notes."
                          position="right"
                        >
                          <div>
                            <Link
                              to={`/customers/${customer.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {customer.Title}
                            </Link>
                            <div className="text-xs text-gray-500">
                              #{customer.id}
                            </div>
                          </div>
                        </TutorTooltip>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {customer.Email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {customer.Phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">—</td>
                    <td className="px-6 py-4 text-gray-400">—</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          customer.Status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {customer.Status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/customers/${customer.id}`}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
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
    </div>
  );
};

export default Customers;
