import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Cloud,
  Filter,
  Search,
  ServerCog,
} from "lucide-react";
import ServiceProviderLogo from "../components/ServiceProviderLogo";
import { normalizeCloudProvider } from "../constants/cloudProviders";
import { serviceProviders } from "../constants/serviceProviders";
import { useOrders } from "../services/useOrdersQuery";

const ServiceCatalog = () => {
  const { data: ordersData, isLoading } = useOrders();
  const orders = Array.isArray(ordersData) ? ordersData : [];
  const [searchQuery, setSearchQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState("All");

  const providerSummaries = useMemo(
    () =>
      serviceProviders.map((provider) => {
        const providerOrders = orders.filter(
          (order) =>
            normalizeCloudProvider(order.CloudProvider ?? "") === provider.provider,
        );
        const accountIds = new Set(
          providerOrders
            .map((order) => order.AccountID?.trim())
            .filter((accountId): accountId is string => Boolean(accountId)),
        );
        const openOrders = providerOrders.filter(
          (order) => !["Completed", "Cancelled"].includes(order.Status ?? ""),
        ).length;
        const serviceTypes = new Set(
          providerOrders
            .map((order) => order.ServiceType?.trim())
            .filter((serviceType): serviceType is string => Boolean(serviceType)),
        );

        return {
          provider,
          orderCount: providerOrders.length,
          accountCount: accountIds.size,
          openOrders,
          serviceTypeCount: serviceTypes.size,
        };
      }),
    [orders],
  );

  const filteredProviders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return providerSummaries.filter((summary) => {
      if (accountFilter === "With Accounts" && summary.accountCount === 0) {
        return false;
      }
      if (accountFilter === "Open Orders" && summary.openOrders === 0) {
        return false;
      }

      if (!query) return true;

      return [
        summary.provider.displayName,
        summary.provider.shortName,
        summary.provider.headline,
        summary.provider.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [accountFilter, providerSummaries, searchQuery]);

  const totalAccounts = providerSummaries.reduce(
    (sum, provider) => sum + provider.accountCount,
    0,
  );
  const totalLinkedOrders = providerSummaries.reduce(
    (sum, provider) => sum + provider.orderCount,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="label-text mb-2 text-[#1d1d1f]/40">
            Provider Service Accounts
          </div>
          <h1
            className="text-[28px] font-semibold text-[#1d1d1f]"
            style={{ letterSpacing: "-0.28px", lineHeight: "1.1" }}
          >
            Services
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#1d1d1f]/50">
            Choose a cloud provider to view service account information, filter
            account records, and open the linked source orders.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#dad4c8] bg-white p-2 shadow-sm">
          <div className="px-3 py-2">
            <p className="text-xl font-semibold text-[#1d1d1f]">
              {serviceProviders.length}
            </p>
            <p className="text-[11px] text-[#1d1d1f]/45">Providers</p>
          </div>
          <div className="border-x border-[#dad4c8] px-3 py-2">
            <p className="text-xl font-semibold text-[#1d1d1f]">
              {isLoading ? "-" : totalAccounts}
            </p>
            <p className="text-[11px] text-[#1d1d1f]/45">Accounts</p>
          </div>
          <div className="px-3 py-2">
            <p className="text-xl font-semibold text-[#1d1d1f]">
              {isLoading ? "-" : totalLinkedOrders}
            </p>
            <p className="text-[11px] text-[#1d1d1f]/45">Linked Orders</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#dad4c8] bg-[#faf9f7] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#1d1d1f]/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search provider, account view, or cloud service..."
              className="w-full rounded-xl border border-[#dad4c8] bg-white py-2 pl-9 pr-4 text-sm text-[#1d1d1f] transition-all placeholder:text-[#1d1d1f]/30 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 lg:w-[30rem]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#1d1d1f]/35" />
            <select
              value={accountFilter}
              onChange={(event) => setAccountFilter(event.target.value)}
              className="rounded-xl border border-[#dad4c8] bg-white px-3 py-2 text-sm font-medium text-[#55534e] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
              aria-label="Filter service providers"
            >
              <option value="All">All Providers</option>
              <option value="With Accounts">With Accounts</option>
              <option value="Open Orders">Open Orders</option>
            </select>
          </div>
        </div>

        <div className="sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-[#dad4c8] bg-white p-3 shadow-sm">
          {serviceProviders.map((provider) => (
            <Link
              key={provider.id}
              to={`/services/${provider.id}`}
              className="flex min-w-fit items-center gap-2 rounded-xl border border-[#dad4c8] bg-white px-3 py-2 text-sm font-semibold text-[#55534e] transition-colors hover:bg-[#f5f5f7]"
            >
              <ServiceProviderLogo
                provider={provider}
                imageClassName="h-5 w-12"
                fallbackSize={20}
              />
              <span>{provider.shortName}</span>
            </Link>
          ))}
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredProviders.map(
            ({
              provider,
              accountCount,
              orderCount,
              openOrders,
              serviceTypeCount,
            }) => (
              <Link
                key={provider.id}
                to={`/services/${provider.id}`}
                className="group relative flex min-h-[19rem] flex-col overflow-hidden rounded-2xl border border-[#dad4c8] bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="absolute inset-x-0 top-0 h-2"
                  style={{
                    background: `linear-gradient(90deg, ${provider.primary}, ${provider.secondary})`,
                  }}
                />
                <div className="flex items-start justify-between gap-4 pt-3">
                  <div>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: provider.primary }}
                    >
                      {provider.shortName} service accounts
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-[#1d1d1f]">
                      {provider.displayName}
                    </h2>
                  </div>
                  <ServiceProviderLogo
                    provider={provider}
                    imageClassName="h-11 w-24"
                    fallbackSize={40}
                  />
                </div>

                <p className="mt-3 text-sm leading-6 text-[#55534e]">
                  {provider.description}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div
                    className="rounded-xl p-3"
                    style={{ backgroundColor: provider.surface }}
                  >
                    <p className="text-lg font-semibold text-[#1d1d1f]">
                      {isLoading ? "-" : accountCount}
                    </p>
                    <p className="mt-1 text-[11px] text-[#1d1d1f]/45">
                      Accounts
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#f5f5f7] p-3">
                    <p className="text-lg font-semibold text-[#1d1d1f]">
                      {isLoading ? "-" : orderCount}
                    </p>
                    <p className="mt-1 text-[11px] text-[#1d1d1f]/45">
                      Orders
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#f5f5f7] p-3">
                    <p className="text-lg font-semibold text-[#1d1d1f]">
                      {isLoading ? "-" : openOrders}
                    </p>
                    <p className="mt-1 text-[11px] text-[#1d1d1f]/45">Open</p>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between pt-5">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#1d1d1f]/45">
                    <ServerCog className="h-3.5 w-3.5" />
                    <span>{serviceTypeCount} service types</span>
                  </div>
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform group-hover:translate-x-1"
                    style={{ backgroundColor: provider.primary }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ),
          )}
        </div>

        {filteredProviders.length === 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <Cloud className="mb-3 h-8 w-8 text-[#1d1d1f]/25" />
            <p className="font-semibold text-[#1d1d1f]">No providers found</p>
            <p className="mt-1 text-sm text-[#1d1d1f]/45">
              Adjust the search or provider filter.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#dad4c8] bg-[#1d1d1f] p-5 text-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="label-text mb-2 text-white/35">Service View</p>
            <p className="text-sm leading-6 text-white/75">
              Each provider page uses provider colors and shows service account
              data from linked orders, including account IDs, login emails,
              billing accounts, status, and order references.
            </p>
          </div>
          <BadgeCheck className="h-8 w-8 shrink-0 text-white/35" />
        </div>
      </div>
    </div>
  );
};

export default ServiceCatalog;
