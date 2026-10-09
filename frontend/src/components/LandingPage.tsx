import React from "react";
import TargetCursor from "./TargetCursor";
import {
  Navbar,
  HeroSection,
  SocialProofBar,
  CodeReviewSection,
  TriageBoardSection,
  ProjectHealthSection,
  ContextEngineSection,
  FinalCTASection,
  Footer,
} from "./landing";

interface LandingPageProps {
  loggingIn: boolean;
  handleGitHubLogin: () => void;
}

export function LandingPageComponent({ loggingIn, handleGitHubLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 selection:bg-zinc-800 selection:text-white font-sans antialiased relative">
      {/* Precision Target Cursor */}
      <TargetCursor targetSelector=".cursor-target" cursorColor="#ffffff" />

      {/* 1. Compact Navbar */}
      <Navbar handleGitHubLogin={handleGitHubLogin} loggingIn={loggingIn} />

      <main>
        {/* 2. Hero Section: Split Headline + Large Tabbed Product Showcase */}
        <HeroSection handleGitHubLogin={handleGitHubLogin} loggingIn={loggingIn} />

        {/* 3. Social Proof & Key Metrics */}
        <SocialProofBar />

        {/* 4. AI Code Review & Diff Viewer */}
        <CodeReviewSection />

        {/* 5. PR Triage & Flow Control Kanban */}
        <TriageBoardSection />

        {/* 6. Continuous Project Health & Heatmap Monitoring */}
        <ProjectHealthSection />

        {/* 7. Unified Knowledge Graph & Context Engine */}
        <ContextEngineSection />

        {/* 8. Final Call to Action */}
        <FinalCTASection handleGitHubLogin={handleGitHubLogin} loggingIn={loggingIn} />
      </main>

      {/* 9. Minimalist Footer with Giant Watermark */}
      <Footer />
    </div>
  );
}
