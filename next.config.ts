import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
    // Project photography is loaded straight from Danube's own site until the
    // images are supplied and hosted with the app.
    remotePatterns: [{ protocol: "https", hostname: "danubeproperties.com", pathname: "/wp-content/uploads/**" }],
  },
};

export default nextConfig;
