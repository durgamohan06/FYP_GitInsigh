import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  GitBranch,
  Github,
  GitPullRequest,
  LayoutDashboard,
  Menu,
  Sparkles,
  Users,
  X,
  Zap,
  FileText,
  CircleDot,
} from "lucide-react";
import "../landing.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GitInsight AI — See the bigger picture behind your code" },
      {
        name: "description",
        content:
          "Turn GitHub activity into a clear picture of project progress. Explore repository health, team activity, and AI-powered insights with GitInsight AI.",
      },
    ],
  }),
  component: LandingPage,
});

// Replace these example values with real product data when it is available.
const sampleMetrics = [
  { label: "Total commits", value: "248", note: "+18% this week", icon: GitBranch },
  { label: "Pull requests", value: "32", note: "24 merged this week", icon: GitPullRequest },
  { label: "Active contributors", value: "12", note: "Across 4 repositories", icon: Users },
];
const sampleActivity = [38, 56, 44, 72, 48, 64, 85, 57, 74, 62, 91, 70, 83, 98];
const features = [
  {
    icon: LayoutDashboard,
    tag: "THE BIG PICTURE",
    title: "Every repository. One clear view.",
    text: "Bring commits, pull requests, and project activity together. Spend less time switching tabs and more time understanding progress.",
  },
  {
    icon: Sparkles,
    tag: "LESS NOISE, MORE SIGNAL",
    title: "Insights that move work forward.",
    text: "Turn development activity into understandable summaries. Surface patterns, spot potential blockers, and decide what needs attention.",
  },
  {
    icon: Users,
    tag: "BUILT AROUND YOUR TEAM",
    title: "Understand how work happens.",
    text: "Explore contribution trends and collaboration across projects, with the context you need for a better team conversation.",
  },
];
const steps = [
  {
    title: "Connect your GitHub",
    text: "Sign in with GitHub to bring your development workflow into view.",
  },
  {
    title: "Choose your repositories",
    text: "Focus on the projects that matter to you and your team.",
  },
  {
    title: "Find your next move",
    text: "Explore activity, review insights, and turn the bigger picture into action.",
  },
];
const faqs = [
  {
    question: "What is GitInsight AI?",
    answer:
      "GitInsight AI is a project intelligence dashboard that brings GitHub repository activity, team analytics, and AI-assisted insights into one workspace.",
  },
  {
    question: "Is the data on this page real?",
    answer:
      "The dashboard preview uses fictional sample data to illustrate the experience. These numbers are not customer results. Once you sign in, the app can display data from your connected GitHub account.",
  },
  {
    question: "How do I get started?",
    answer:
      "Use the Log in button at the top of this page, or any Connect GitHub button, to open the existing GitHub sign-in flow.",
  },
];

function Brand() {
  return (
    <a href="/" className="lp-brand" aria-label="GitInsight AI home">
      <span className="lp-brand-icon">
        <GitBranch size={21} />
      </span>
      GitInsight<span className="lp-ai">AI</span>
    </a>
  );
}

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="landing-page">
      <a className="lp-skip" href="#main">
        Skip to content
      </a>
      <header className="lp-header">
        <div className="lp-container lp-nav">
          <Brand />
          <nav className="lp-desktop-nav" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#preview">Product preview</a>
          </nav>
          <div className="lp-nav-actions">
            <a className="lp-login" href="/api/auth/github">
              <Github size={17} />
              Log in
              <ArrowUpRight size={15} />
            </a>
            <button
              className="lp-menu"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="mobile-navigation" className="lp-mobile-nav" aria-label="Mobile navigation">
            {[
              ["Features", "features"],
              ["How it works", "how-it-works"],
              ["Product preview", "preview"],
            ].map(([label, id]) => (
              <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>
                {label}
                <ArrowRight size={16} />
              </a>
            ))}
          </nav>
        )}
      </header>
      <main id="main">
        <section className="lp-hero lp-container">
          <div className="lp-eyebrow">
            <span /> YOUR REPOSITORIES, WITH PERSPECTIVE
          </div>
          <h1>
            Great code tells a story.
            <br />
            <span>See the bigger picture.</span>
          </h1>
          <p className="lp-hero-description">
            From scattered GitHub activity to a clear view of progress.
            <br className="lp-desktop-break" /> Understand your projects, support your team, and
            know what’s next.
          </p>
          <div className="lp-hero-actions">
            <a className="lp-button lp-button-primary" href="/api/auth/github">
              <Github size={19} />
              Connect GitHub
              <ArrowRight size={17} />
            </a>
            <a className="lp-button lp-button-secondary" href="#preview">
              Explore the preview
              <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="lp-hero-note">
            <Check size={14} /> Built for GitHub workflows<span>·</span>
            <Check size={14} /> Clarity from commit to delivery
          </div>
          <div className="lp-preview" id="preview">
            <div className="lp-window-bar">
              <div className="lp-window-dots">
                <i />
                <i />
                <i />
              </div>
              <span>workspace / overview</span>
              <span className="lp-sample">Sample data</span>
            </div>
            <div className="lp-preview-layout">
              <aside className="lp-preview-sidebar" aria-label="Illustrative dashboard sidebar">
                <div className="lp-workspace">
                  <span>O</span>Orbit workspace
                </div>
                <div className="lp-sidebar-item active">
                  <LayoutDashboard size={16} />
                  Overview
                </div>
                <div className="lp-sidebar-item">
                  <GitBranch size={16} />
                  Repositories
                </div>
                <div className="lp-sidebar-item">
                  <Sparkles size={16} />
                  AI insights
                </div>
                <div className="lp-sidebar-item">
                  <Users size={16} />
                  Team analytics
                </div>
                <div className="lp-sidebar-item">
                  <FileText size={16} />
                  Reports
                </div>
                <div className="lp-sidebar-bottom">
                  <span className="lp-online" />
                  All systems in view
                </div>
              </aside>
              <div className="lp-dashboard">
                <div className="lp-dashboard-heading">
                  <div>
                    <span className="lp-muted-label">YOUR PROJECTS AT A GLANCE</span>
                    <h2>A little context. A lot of clarity.</h2>
                  </div>
                  <span className="lp-period">Last 14 days</span>
                </div>
                <div className="lp-metrics">
                  {sampleMetrics.map(({ label, value, note, icon: Icon }) => (
                    <div className="lp-metric" key={label}>
                      <div>
                        {label}
                        <Icon size={15} />
                      </div>
                      <strong>{value}</strong>
                      <small>{note}</small>
                    </div>
                  ))}
                </div>
                <div className="lp-dashboard-lower">
                  <div className="lp-chart">
                    <div className="lp-card-heading">
                      <h3>Commit activity</h3>
                      <span>
                        <i />
                        Commits
                      </span>
                    </div>
                    <div
                      className="lp-bars"
                      role="img"
                      aria-label="Illustrative commit activity over fourteen days, showing a generally increasing trend"
                    >
                      {sampleActivity.map((height, index) => (
                        <div key={index} style={{ height: `${height}%` }} />
                      ))}
                    </div>
                    <div className="lp-chart-axis">
                      <span>Week 1</span>
                      <span>Week 2</span>
                    </div>
                  </div>
                  <div className="lp-insight">
                    <div className="lp-insight-label">
                      <Sparkles size={16} /> AI SPOTLIGHT
                    </div>
                    <h3>Momentum is building.</h3>
                    <p>
                      Commit activity is up this week. Two pull requests are ready for a fresh pair
                      of eyes.
                    </p>
                    <div className="lp-insight-footer">
                      <CircleDot size={14} /> Example insight
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="lp-preview-caption">
            A glimpse of your next workspace. Preview shown with illustrative data.
          </p>
        </section>
        <div className="lp-value-strip">
          <div className="lp-container">
            <span>
              LESS TAB SWITCHING.
              <br />
              <strong>MORE UNDERSTANDING.</strong>
            </span>
            <div>
              <GitBranch />
              Repository visibility
            </div>
            <div>
              <Sparkles />
              AI-powered context
            </div>
            <div>
              <Users />
              Team perspective
            </div>
          </div>
        </div>
        <section className="lp-section lp-container" id="features">
          <div className="lp-section-heading">
            <div>
              <span className="lp-kicker">A CLEARER WAY TO WORK</span>
              <h2>Go beyond the commit count.</h2>
            </div>
            <p>
              The details matter. So does knowing how they fit together. Give your workflow a little
              perspective.
            </p>
          </div>
          <div className="lp-features">
            {features.map(({ icon: Icon, tag, title, text }, index) => (
              <article key={title}>
                <div className={`lp-feature-icon lp-feature-icon-${index}`}>
                  <Icon size={24} />
                </div>
                <span className="lp-feature-tag">{tag}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="lp-how" id="how-it-works">
          <div className="lp-container">
            <span className="lp-kicker">FROM ACTIVITY TO UNDERSTANDING</span>
            <h2>Your next insight starts here.</h2>
            <div className="lp-steps">
              {steps.map(({ title, text }, index) => (
                <article key={title}>
                  <span className="lp-step-number">0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="lp-section lp-container lp-faq">
          <div>
            <span className="lp-kicker">A FEW MORE DETAILS</span>
            <h2>
              Good questions.
              <br />
              Clear answers.
            </h2>
          </div>
          <div>
            {faqs.map(({ question, answer }) => (
              <details key={question}>
                <summary>
                  {question}
                  <ChevronDown size={18} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="lp-container">
          <div className="lp-final-cta">
            <div className="lp-cta-symbol">
              <Zap size={26} />
            </div>
            <span className="lp-kicker">SEE WHAT’S TAKING SHAPE</span>
            <h2>
              Your code is moving.
              <br />
              Know where it’s heading.
            </h2>
            <p>Bring your GitHub projects into focus with GitInsight AI.</p>
            <a className="lp-button lp-button-primary" href="/api/auth/github">
              <Github size={19} />
              Connect GitHub
              <ArrowRight size={17} />
            </a>
          </div>
        </section>
      </main>
      <footer className="lp-container lp-footer">
        <Brand />
        <p>Built for the people behind the pull requests.</p>
        <a href="#main">Back to top ↑</a>
      </footer>
    </div>
  );
}
