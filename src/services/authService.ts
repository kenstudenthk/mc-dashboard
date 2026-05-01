interface CloudflareIdentity {
  email: string;
  name?: string;
}

export const authService = {
  /**
   * Returns the Cloudflare Access-verified identity, or null if not available
   * (e.g. local development where Access is not active).
   */
  getIdentity: async (): Promise<CloudflareIdentity | null> => {
    try {
      const res = await fetch("/cdn-cgi/access/get-identity");
      if (!res.ok) return null;
      const data = await res.json();
      if (data && typeof data.email === "string") return data as CloudflareIdentity;
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Signs the user out. Clears localStorage and, when Cloudflare Access is
   * active, fires a best-effort request to clear the CF session cookie without
   * navigating away so the app can show its own signed-out screen.
   */
  logout: async (hasCFAccess: boolean): Promise<void> => {
    localStorage.removeItem("userEmail");
    if (hasCFAccess) {
      try {
        await fetch("/cdn-cgi/access/logout", { redirect: "manual" });
      } catch {
        // token will expire naturally if the endpoint is unreachable
      }
    }
  },
};
