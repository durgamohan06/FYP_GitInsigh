import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LandingPageComponent } from "../components/LandingPage";
import "../landing.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GitInsight AI — AI-Powered GitHub Project Intelligence" },
      {
        name: "description",
        content:
          "Monitor software projects intelligently. AI-powered GitHub dashboards for engineering leaders and project managers.",
      },
      { property: "og:title", content: "GitInsight AI" },
      { property: "og:description", content: "Track software projects intelligently with AI." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [loggingIn, setLoggingIn] = useState(false);

  const handleGitHubLogin = () => {
    setLoggingIn(true);
    window.location.href = "/api/auth/github";
  };

  return <LandingPageComponent loggingIn={loggingIn} handleGitHubLogin={handleGitHubLogin} />;
}

