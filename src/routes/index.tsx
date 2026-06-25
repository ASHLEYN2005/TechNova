import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Compsa — Login" },
      { name: "description", content: "Login to access the Compsa dues payment portal." },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/login", replace: true });
  }, [navigate]);

  return null;
}
