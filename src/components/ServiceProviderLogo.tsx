import React, { useState } from "react";
import CloudProviderLogo from "./CloudProviderLogo";
import { ServiceProviderTheme } from "../constants/serviceProviders";

interface ServiceProviderLogoProps {
  provider: ServiceProviderTheme;
  variant?: "default" | "header";
  className?: string;
  imageClassName?: string;
  fallbackSize?: number;
}

const ServiceProviderLogo = ({
  provider,
  variant = "default",
  className = "",
  imageClassName = "h-10 w-24",
  fallbackSize = 40,
}: ServiceProviderLogoProps) => {
  const [failed, setFailed] = useState(false);
  const logoUrl =
    variant === "header" ? provider.headerLogoUrl ?? provider.logoUrl : provider.logoUrl;

  if (failed || !logoUrl) {
    return (
      <span className={className}>
        <CloudProviderLogo
          provider={provider.provider}
          size={fallbackSize}
          showName={false}
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <img
        src={logoUrl}
        alt={`${provider.displayName} logo`}
        className={`object-contain ${imageClassName}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </span>
  );
};

export default ServiceProviderLogo;
