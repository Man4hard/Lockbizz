import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lockbizz — Installment phone control for shops" },
      { name: "description", content: "Dashboard for mobile installment sellers: customers, payments and device locks." },
      { property: "og:title", content: "Lockbizz" },
      { property: "og:description", content: "Dashboard for mobile installment sellers: customers, payments and device locks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
