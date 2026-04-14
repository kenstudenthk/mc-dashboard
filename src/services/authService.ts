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
   * Signs the user out via Cloudflare Access. Redirects to the Access logout
   * endpoint which clears the session token and redirects back to the login page.
   */
  logout: (): void => {
    window.location.href = "/cdn-cgi/access/logout";
  },
};
