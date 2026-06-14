import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/constants";

/**
 * Google Scholar requirement: article pages, issue TOCs, archives and PDFs
 * must be crawlable. Editorial/admin areas are excluded.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api/", "/login", "/register", "/forgot-password"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
