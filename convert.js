const fs = require('fs');

let html = fs.readFileSync('landing/index.html', 'utf8');

// Extract the body content (everything inside <body>...</body>, minus the script tag)
const bodyMatch = html.match(/<body>([\s\S]*?)<script src="script.js"><\/script>\s*<\/body>/);
if (!bodyMatch) {
  console.log('Could not find body match');
  process.exit(1);
}
let bodyHtml = bodyMatch[1];

// Convert to JSX
bodyHtml = bodyHtml.replace(/class=/g, 'className=');
bodyHtml = bodyHtml.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');
bodyHtml = bodyHtml.replace(/<br>/g, '<br />');
bodyHtml = bodyHtml.replace(/<img([^>]*)>/g, (match, p1) => {
  return p1.endsWith('/') ? match : `<img${p1} />`;
});
bodyHtml = bodyHtml.replace(/<input([^>]*)>/g, (match, p1) => {
  return p1.endsWith('/') ? match : `<input${p1} />`;
});

// Convert style="..." to style={{...}}
bodyHtml = bodyHtml.replace(/style="([^"]+)"/g, (match, styles) => {
  const parts = styles.split(';').filter(Boolean);
  const styleObj = {};
  for (const part of parts) {
    const [key, value] = part.split(':').map(s => s.trim());
    if (key && value) {
      const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
      styleObj[camelKey] = value;
    }
  }
  return `style={${JSON.stringify(styleObj)}}`;
});

// Fix SVG elements (e.g. stroke-width -> strokeWidth)
bodyHtml = bodyHtml.replace(/stroke-width=/g, 'strokeWidth=');
bodyHtml = bodyHtml.replace(/stroke-linecap=/g, 'strokeLinecap=');
bodyHtml = bodyHtml.replace(/stroke-linejoin=/g, 'strokeLinejoin=');
bodyHtml = bodyHtml.replace(/fill-rule=/g, 'fillRule=');
bodyHtml = bodyHtml.replace(/clip-rule=/g, 'clipRule=');

// Output the JSX to a file
fs.writeFileSync('landing/jsx-output.tsx', `
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export function LandingPageComponent({ loggingIn, handleGitHubLogin }) {
  useEffect(() => {
    // Scroll handling for nav
    const nav = document.querySelector('.nav');
    const toggle = document.querySelector('.nav-mobile-toggle');
    
    const handleScroll = () => {
      if (window.pageYOffset > 20) {
        nav?.classList.add('scrolled');
      } else {
        nav?.classList.remove('scrolled');
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Scroll Reveal
    const reveals = document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    
    reveals.forEach(el => observer.observe(el));

    // Dashboard animations
    const bars = document.querySelectorAll('.hero-dash-bar');
    const heights = [30, 50, 25, 70, 45, 85, 35, 60, 90, 40, 75, 55, 80, 30, 65, 95, 50, 70, 40, 85];
    bars.forEach((bar, i) => {
      if (bar instanceof HTMLElement) bar.style.height = heights[i % heights.length] + '%';
    });
    
    const dashInterval = setInterval(() => {
      bars.forEach((bar) => {
        if (bar instanceof HTMLElement) bar.style.height = (Math.random() * 80 + 15) + '%';
      });
    }, 4000);

    const chartBars = document.querySelectorAll('.dash-chart-bar');
    const chartHeights = [40, 65, 30, 80, 55, 95, 45, 70, 35, 85, 60, 50, 75, 90, 40, 55, 70, 80, 45, 65, 30, 85, 50, 95];
    chartBars.forEach((bar, i) => {
      if (bar instanceof HTMLElement) bar.style.height = (chartHeights[i % chartHeights.length]) + '%';
    });
    
    const chartInterval = setInterval(() => {
      chartBars.forEach((bar) => {
        if (bar instanceof HTMLElement) bar.style.height = (Math.random() * 75 + 20) + '%';
      });
    }, 5000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      clearInterval(dashInterval);
      clearInterval(chartInterval);
    };
  }, []);

  return (
    <div className="landing-page-wrapper">
      ${bodyHtml}
    </div>
  );
}
`);
console.log('JSX converted!');
