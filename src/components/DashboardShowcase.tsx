import React, { useEffect, useRef, useState } from 'react';
import { 
  BarChart3, 
  Search, 
  FileText, 
  Shield, 
  Calendar, 
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Home,
  Phone
} from 'lucide-react';

const DashboardShowcase: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentStepMobile, setCurrentStepMobile] = useState(0);
  const highlightRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<SVGSVGElement>(null);
  const dashboardFrameRef = useRef<HTMLDivElement>(null);
  
  // Mobile refs
  const mobileHighlightRef = useRef<HTMLDivElement>(null);
  const mobileTooltipRef = useRef<HTMLDivElement>(null);
  const mobileTapRef = useRef<HTMLDivElement>(null);
  const phoneScreenRef = useRef<HTMLDivElement>(null);
  const appContentRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      feature: 'health',
      title: 'Legal Health Score',
      text: 'See your overall legal protection status at a glance. We analyze your business and show you exactly where you stand.',
      position: 'left'
    },
    {
      feature: 'profile',
      title: 'Smart Recommendations',
      text: 'AI-powered guidance tells you exactly what to do next based on your specific business type and services.',
      position: 'bottom'
    },
    {
      feature: 'action-plan',
      title: 'Your Legal Action Plan',
      text: 'A clear roadmap with actionable steps. Track your progress as you build bulletproof legal protection.',
      position: 'right'
    },
    {
      feature: 'risk',
      title: 'Risk Score',
      text: 'Real-time assessment of your legal exposure. Watch it drop as you complete protective measures.',
      position: 'left'
    },
    {
      feature: 'documents',
      title: 'Personalized Documents',
      text: 'Get exactly the legal documents you need, customized for your business. Generate, download, and stay protected.',
      position: 'top'
    }
  ];

  const mobileSteps = [
    {
      feature: 'health',
      title: 'Legal Health at a Glance',
      text: 'Your overall legal protection status — see where you stand instantly.'
    },
    {
      feature: 'profile',
      title: 'Smart Next Steps',
      text: 'AI-powered guidance shows you exactly what to do based on your business type.'
    },
    {
      feature: 'risk',
      title: 'Risk Score & Progress',
      text: 'Track your legal exposure and watch it drop as you complete protective steps.'
    },
    {
      feature: 'action-plan',
      title: 'Your Action Plan',
      text: 'A clear checklist of tasks to build bulletproof legal protection for your business.'
    },
    {
      feature: 'documents',
      title: 'Personalized Documents',
      text: 'Get exactly the legal documents you need, customized and ready to download.'
    }
  ];

  useEffect(() => {
    const showStep = (index: number) => {
      if (index >= steps.length) {
        index = 0;
      }
      
      const step = steps[index];
      const element = document.querySelector(`[data-feature="${step.feature}"]`);
      const highlight = highlightRef.current;
      const tooltip = tooltipRef.current;
      const cursor = cursorRef.current;
      const frame = dashboardFrameRef.current;
      
      if (!element || !highlight || !tooltip || !cursor || !frame) return;

      const rect = element.getBoundingClientRect();
      const containerRect = frame.getBoundingClientRect();

      // Position highlight
      highlight.style.left = (rect.left - containerRect.left - 8) + 'px';
      highlight.style.top = (rect.top - containerRect.top - 8) + 'px';
      highlight.style.width = (rect.width + 16) + 'px';
      highlight.style.height = (rect.height + 16) + 'px';
      highlight.classList.add('active');

      // Update tooltip content
      const tooltipTitle = tooltip.querySelector('#tooltip-title-text');
      const tooltipText = tooltip.querySelector('#tooltip-text');
      if (tooltipTitle) tooltipTitle.textContent = step.title;
      if (tooltipText) tooltipText.textContent = step.text;

      // Remove old position classes
      tooltip.classList.remove('left', 'right', 'top', 'bottom');
      tooltip.classList.add(step.position);

      // Position tooltip
      const tooltipRect = tooltip.getBoundingClientRect();
      let tooltipX, tooltipY;

      switch(step.position) {
        case 'left':
          tooltipX = rect.left - containerRect.left - tooltipRect.width - 24;
          tooltipY = rect.top - containerRect.top + (rect.height / 2) - 40;
          break;
        case 'right':
          tooltipX = rect.right - containerRect.left + 24;
          tooltipY = rect.top - containerRect.top + (rect.height / 2) - 40;
          break;
        case 'top':
          tooltipX = rect.left - containerRect.left + (rect.width / 2) - (tooltipRect.width / 2);
          tooltipY = rect.top - containerRect.top - tooltipRect.height - 24;
          break;
        case 'bottom':
          tooltipX = rect.left - containerRect.left + (rect.width / 2) - (tooltipRect.width / 2);
          tooltipY = rect.bottom - containerRect.top + 24;
          break;
      }

      tooltip.style.left = tooltipX + 'px';
      tooltip.style.top = tooltipY + 'px';
      tooltip.classList.add('active');

      // Position cursor
      cursor.style.left = (rect.left - containerRect.left + rect.width / 2) + 'px';
      cursor.style.top = (rect.top - containerRect.top + rect.height / 2) + 'px';
      cursor.classList.add('active');
    };

    let intervalId: NodeJS.Timeout;
    
    // Start animation after a brief delay
    const timeout = setTimeout(() => {
      showStep(0);
      intervalId = setInterval(() => {
        setCurrentStep(prev => {
          const next = (prev + 1) % steps.length;
          setTimeout(() => showStep(next), 100);
          return next;
        });
      }, 4000);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [steps]);

  // Mobile animation effect
  useEffect(() => {
    const showStepMobile = (index: number) => {
      if (index >= mobileSteps.length) {
        index = 0;
      }
      
      const step = mobileSteps[index];
      const element = document.querySelector(`[data-feature-mobile="${step.feature}"]`);
      const highlight = mobileHighlightRef.current;
      const tooltip = mobileTooltipRef.current;
      const tap = mobileTapRef.current;
      const phoneScreen = phoneScreenRef.current;
      
      if (!element || !highlight || !tooltip || !tap || !phoneScreen) return;

      // Get positions without scrolling - just use current viewport positions
      const rect = element.getBoundingClientRect();
      const screenRect = phoneScreen.getBoundingClientRect();

      // Only animate if element is visible in viewport (don't force scroll)
      const isVisible = rect.top >= screenRect.top && rect.bottom <= screenRect.bottom;
      
      if (!isVisible) {
        // If not visible, just update tooltip with general message
        const tooltipTitle = tooltip.querySelector('#tooltip-title-text-mobile');
        const tooltipText = tooltip.querySelector('#tooltip-text-mobile');
        if (tooltipTitle) tooltipTitle.textContent = step.title;
        if (tooltipText) tooltipText.textContent = step.text;
        tooltip.classList.add('active');
        highlight.classList.remove('active');
        tap.classList.remove('active');
        return;
      }

      // Position highlight smoothly
      highlight.style.left = (rect.left - screenRect.left - 6) + 'px';
      highlight.style.top = (rect.top - screenRect.top - 6) + 'px';
      highlight.style.width = (rect.width + 12) + 'px';
      highlight.style.height = (rect.height + 12) + 'px';
      highlight.classList.add('active');

      // Show tap indicator
      tap.style.left = (rect.left - screenRect.left + rect.width / 2 - 20) + 'px';
      tap.style.top = (rect.top - screenRect.top + rect.height / 2 - 20) + 'px';
      tap.classList.remove('active');
      setTimeout(() => tap.classList.add('active'), 50);

      // Update tooltip content
      const tooltipTitle = tooltip.querySelector('#tooltip-title-text-mobile');
      const tooltipText = tooltip.querySelector('#tooltip-text-mobile');
      if (tooltipTitle) tooltipTitle.textContent = step.title;
      if (tooltipText) tooltipText.textContent = step.text;
      tooltip.classList.add('active');
    };

    let intervalIdMobile: NodeJS.Timeout;
    
    const timeout = setTimeout(() => {
      showStepMobile(0);
      intervalIdMobile = setInterval(() => {
        setCurrentStepMobile(prev => {
          const next = (prev + 1) % mobileSteps.length;
          // Use requestAnimationFrame for smoother transitions
          requestAnimationFrame(() => {
            showStepMobile(next);
          });
          return next;
        });
      }, 4000);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (intervalIdMobile) clearInterval(intervalIdMobile);
    };
  }, [mobileSteps]);

  const features = [
    {
      icon: BarChart3,
      title: "Legal Health Score",
      description: "Get an instant risk assessment of your business. See exactly where you're protected and where you need attention.",
      color: "text-blue-600",
      bg: "bg-blue-50",
      iconBg: "bg-blue-100"
    },
    {
      icon: Search,
      title: "Website Compliance Scanner",
      description: "Automatically scan your website to find missing legal documents and compliance issues. Get instant recommendations.",
      color: "text-purple-600",
      bg: "bg-purple-50",
      iconBg: "bg-purple-100"
    },
    {
      icon: Sparkles,
      title: "Personalized Recommendations",
      description: "AI-powered suggestions tailored to your specific business type, size, and services. No more guessing what you need.",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100"
    },
    {
      icon: FileText,
      title: "Document Vault",
      description: "Store, organize, and access all your legal documents in one secure place. Never lose track of what you've signed.",
      color: "text-orange-600",
      bg: "bg-orange-50",
      iconBg: "bg-orange-100"
    },
    {
      icon: Calendar,
      title: "Compliance Calendar",
      description: "Never miss a renewal or update. Get automatic reminders for document reviews, contract expirations, and legal deadlines.",
      color: "text-teal-600",
      bg: "bg-teal-50",
      iconBg: "bg-teal-100"
    },
    {
      icon: Shield,
      title: "Next Best Action",
      description: "Your dashboard tells you exactly what to do next. No confusion—just clear, actionable steps to stay protected.",
      color: "text-rose-600",
      bg: "bg-rose-50",
      iconBg: "bg-rose-100"
    }
  ];

  return (
    <>
      <style>{`
        .dashboard-walkthrough {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .dashboard-frame {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          position: relative;
        }
        .browser-chrome {
          background: #f8fafc;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        .browser-dots {
          display: flex;
          gap: 6px;
        }
        .browser-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .browser-dot.red { background: #ff5f57; }
        .browser-dot.yellow { background: #febc2e; }
        .browser-dot.green { background: #28c840; }
        .browser-url {
          flex: 1;
          background: #fff;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 13px;
          color: #64748b;
          margin-left: 12px;
          border: 1px solid #e2e8f0;
        }
        .dashboard-layout {
          display: flex;
          min-height: 550px;
        }
        .sidebar {
          width: 200px;
          background: #fff;
          border-right: 1px solid #e2e8f0;
          padding: 20px 0;
          flex-shrink: 0;
        }
        .sidebar-logo {
          padding: 0 20px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          color: #0d9488;
          font-size: 15px;
        }
        .sidebar-logo-icon {
          width: 24px;
          height: 24px;
          background: #0d9488;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sidebar-nav {
          list-style: none;
        }
        .sidebar-nav li {
          position: relative;
        }
        .sidebar-nav a {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          color: #64748b;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.2s;
        }
        .sidebar-nav a.active {
          background: #f0fdfa;
          color: #0d9488;
          border-right: 3px solid #0d9488;
        }
        .main-content {
          flex: 1;
          padding: 24px 32px;
          background: #fafbfc;
          overflow: hidden;
          position: relative;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .dashboard-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }
        .dashboard-subtitle {
          font-size: 14px;
          color: #64748b;
          margin-top: 4px;
        }
        .legal-health-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          padding: 8px 16px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .legal-health-text {
          font-size: 12px;
          color: #64748b;
        }
        .legal-health-status {
          font-weight: 600;
          color: #0d9488;
        }
        .legal-health-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #0d9488, #14b8a6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          margin-bottom: 16px;
          position: relative;
          transition: all 0.3s ease;
        }
        .profile-card {
          background: linear-gradient(135deg, #f0fdfa 0%, #fff 100%);
          border: 1px solid #99f6e4;
        }
        .profile-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .recommended-badge {
          font-size: 10px;
          font-weight: 600;
          color: #0d9488;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .profile-card h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }
        .profile-card p {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }
        .btn-primary {
          background: #0d9488;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-primary:hover {
          background: #0f766e;
        }
        .action-plan {
          display: flex;
          gap: 20px;
        }
        .action-plan-main {
          flex: 1;
        }
        .action-plan-sidebar {
          width: 160px;
        }
        .action-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .action-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }
        .steps-badge {
          background: #1e293b;
          color: #fff;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 500;
        }
        .action-subtitle {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 16px;
        }
        .step-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .step-item:last-child {
          border-bottom: none;
        }
        .step-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .step-icon.pending {
          background: #f1f5f9;
          color: #94a3b8;
        }
        .step-icon.complete {
          background: #0d9488;
          color: #fff;
        }
        .step-content {
          flex: 1;
        }
        .step-name {
          font-size: 13px;
          font-weight: 500;
          color: #1e293b;
        }
        .step-desc {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }
        .step-status {
          font-size: 10px;
          font-weight: 600;
          color: #0d9488;
          text-transform: uppercase;
        }
        .btn-outline {
          background: transparent;
          border: 1px solid #e2e8f0;
          color: #64748b;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        }
        .risk-score-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          margin-bottom: 12px;
        }
        .risk-score-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .risk-score-value {
          font-size: 48px;
          font-weight: 700;
          color: #0d9488;
          line-height: 1;
        }
        .risk-score-status {
          display: inline-block;
          margin-top: 8px;
          font-size: 11px;
          font-weight: 600;
          color: #0d9488;
          background: #f0fdfa;
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid #99f6e4;
        }
        .btn-call {
          width: 100%;
          background: #fff;
          border: 1px solid #e2e8f0;
          color: #1e293b;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .documents-section {
          margin-top: 20px;
        }
        .documents-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .documents-header h3 {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }
        .documents-subtitle {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 16px;
        }
        .doc-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .doc-icon {
          width: 32px;
          height: 32px;
          background: #f1f5f9;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }
        .doc-content {
          flex: 1;
        }
        .doc-name {
          font-size: 13px;
          font-weight: 500;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .doc-badge {
          font-size: 9px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .doc-badge.ready {
          background: #dcfce7;
          color: #16a34a;
        }
        .doc-badge.review {
          background: #fef3c7;
          color: #d97706;
        }
        .doc-desc {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }
        .doc-actions {
          display: flex;
          gap: 8px;
        }
        .btn-generate {
          background: #0d9488;
          color: #fff;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
        }
        .btn-download {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .highlight-overlay {
          position: absolute;
          border: 3px solid #0d9488;
          border-radius: 16px;
          pointer-events: none;
          opacity: 0;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.15), 0 0 30px rgba(13, 148, 136, 0.2);
          z-index: 100;
        }
        .highlight-overlay.active {
          opacity: 1;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.15), 0 0 30px rgba(13, 148, 136, 0.2);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(13, 148, 136, 0.1), 0 0 40px rgba(13, 148, 136, 0.3);
          }
        }
        .tooltip {
          position: absolute;
          background: #1e293b;
          color: #fff;
          padding: 16px 20px;
          border-radius: 12px;
          font-size: 14px;
          max-width: 280px;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 101;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .tooltip.active {
          opacity: 1;
          transform: translateY(0);
        }
        .tooltip-title {
          font-weight: 600;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tooltip-text {
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.5;
        }
        .tooltip::after {
          content: '';
          position: absolute;
          width: 12px;
          height: 12px;
          background: #1e293b;
          transform: rotate(45deg);
        }
        .tooltip.left::after {
          right: -6px;
          top: 24px;
        }
        .tooltip.right::after {
          left: -6px;
          top: 24px;
        }
        .tooltip.top::after {
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
        }
        .tooltip.bottom::after {
          top: -6px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
        }
        .demo-cursor {
          position: absolute;
          width: 24px;
          height: 24px;
          pointer-events: none;
          z-index: 200;
          opacity: 0;
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .demo-cursor.active {
          opacity: 1;
        }
        .progress-container {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
        }
        .progress-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #e2e8f0;
          transition: all 0.3s;
          cursor: pointer;
        }
        .progress-dot.active {
          background: #0d9488;
          transform: scale(1.2);
        }
        /* Mobile Styles */
        .dashboard-walkthrough-mobile {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          contain: layout style paint;
        }
        .walkthrough-container-mobile {
          position: relative;
          will-change: auto;
        }
        .phone-frame-mobile::before {
          content: '';
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 24px;
          background: #000;
          border-radius: 20px;
          z-index: 10;
        }
        .phone-screen-mobile {
          contain: layout style paint;
          will-change: auto;
        }
        .app-content-mobile {
          contain: layout style;
          scroll-behavior: smooth;
        }
        .highlight-overlay-mobile {
          will-change: transform, opacity;
          transform: translateZ(0);
        }
        .highlight-overlay-mobile.active {
          opacity: 1;
          animation: pulse-mobile 2s ease-in-out infinite;
        }
        @keyframes pulse-mobile {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.15), 0 0 30px rgba(13, 148, 136, 0.2);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(13, 148, 136, 0.1), 0 0 40px rgba(13, 148, 136, 0.3);
          }
        }
        .tooltip-mobile {
          will-change: transform, opacity;
          transform: translateZ(0);
        }
        .tooltip-mobile.active {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .tooltip-mobile::before {
          content: '';
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 16px;
          height: 16px;
          background: #1e293b;
        }
        .tap-indicator-mobile {
          will-change: transform, opacity;
          transform: translateZ(0);
        }
        .tap-indicator-mobile.active {
          opacity: 1;
          animation: tap-mobile 0.6s ease-out;
        }
        @keyframes tap-mobile {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .progress-container-mobile {
          position: relative;
          z-index: 10;
        }
      `}</style>
      
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white border-t border-slate-200 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-1/3 h-full bg-emerald-50/30 skew-x-12 transform -translate-x-1/4 z-0"></div>
        <div className="absolute bottom-0 right-0 w-1/3 h-full bg-teal-50/30 skew-x-12 transform translate-x-1/4 z-0"></div>
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <span className="inline-block py-1.5 px-4 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-4">
              Intelligent Dashboard
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Smart Legal Command Center</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
              We don't just give you documents—we give you an intelligent dashboard that analyzes your business, tracks your compliance, and guides you every step of the way.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-white p-8 rounded-2xl border border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-xl hover:shadow-emerald-100/40 transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 ${feature.iconBg} ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm group-hover:shadow-lg`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-semibold">Learn more</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            ))}
          </div>

          {/* Dashboard Animation Section */}
          <div className="max-w-6xl mx-auto mb-12">
            {/* Mobile Dashboard Walkthrough */}
            <div className="md:hidden dashboard-walkthrough-mobile">
              <div className="walkthrough-container-mobile max-w-[375px] mx-auto">
                <div className="phone-frame-mobile bg-[#1a1a1a] rounded-[40px] p-3 shadow-2xl relative">
                  <div className="phone-frame-mobile::before absolute top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-[20px] z-10"></div>
                  <div className="phone-screen-mobile bg-white rounded-[32px] overflow-hidden relative h-[700px]" ref={phoneScreenRef}>
                    {/* Status Bar */}
                    <div className="status-bar-mobile bg-white px-6 pt-3.5 pb-2 flex justify-between items-center text-sm font-semibold">
                      <span className="status-time-mobile text-black">9:41</span>
                      <div className="status-icons-mobile flex gap-1 items-center">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3C7.46 3 3.34 4.78.29 7.67c-.18.18-.29.43-.29.71 0 .28.11.53.29.71l11.29 11.29c.37.37 1.04.37 1.41 0l11.29-11.29c.19-.19.29-.44.29-.71 0-.28-.11-.53-.29-.71C21.66 4.78 17.54 3 12 3z"/></svg>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2 22h20V2z"/></svg>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
                      </div>
                    </div>

                    {/* App Header */}
                    <div className="app-header-mobile bg-white px-4 pt-2 pb-4 border-b border-slate-100">
                      <div className="app-logo-mobile flex items-center gap-2 mb-3">
                        <div className="app-logo-icon-mobile w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
                        </div>
                        <span className="app-logo-text-mobile font-semibold text-[15px] text-emerald-600">Conscious Counsel</span>
                      </div>
                      <div className="app-title-row-mobile flex justify-between items-center">
                        <h1 className="app-title-mobile text-xl font-bold text-slate-900">Overview</h1>
                        <div className="health-badge-mobile flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-[20px] border border-emerald-200" data-feature-mobile="health">
                          <span className="health-badge-text-mobile text-[11px] text-emerald-600 font-semibold">Good</span>
                          <div className="health-badge-icon-mobile w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 stroke-white" fill="none" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="app-content-mobile px-4 h-[calc(100%-140px)] overflow-y-auto bg-slate-50" ref={appContentRef}>
                      {/* Profile Card */}
                      <div className="card-mobile bg-white rounded-xl p-3.5 mb-3 shadow-sm relative bg-gradient-to-br from-emerald-50 to-white border border-emerald-200" data-feature-mobile="profile">
                        <div className="recommended-badge-mobile text-[9px] font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">⟳ RECOMMENDED NEXT STEP</div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">Complete Your Business Profile</h3>
                        <p className="text-xs text-slate-500 mb-3">We need a few more details to give you accurate legal recommendations.</p>
                        <button className="btn-primary-mobile bg-emerald-600 text-white border-none py-2.5 px-4 rounded-lg text-xs font-medium w-full flex items-center justify-center gap-1.5">
                          Complete Profile
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Risk Score Row */}
                      <div className="risk-row-mobile flex gap-2.5 mb-3" data-feature-mobile="risk">
                        <div className="risk-score-card-mobile flex-1 bg-white rounded-xl p-3.5 text-center shadow-sm">
                          <div className="risk-score-label-mobile text-[9px] text-slate-500 uppercase tracking-wide mb-1">Risk Score</div>
                          <div className="risk-score-value-mobile text-[32px] font-bold text-emerald-600 leading-none">0</div>
                          <div className="risk-score-status-mobile inline-block mt-1.5 text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-[10px] border border-emerald-200">LOW EXPOSURE</div>
                        </div>
                        <div className="steps-card-mobile flex-1 bg-slate-900 rounded-xl p-3.5 text-white flex flex-col justify-center">
                          <div className="steps-label-mobile text-[9px] text-slate-400 uppercase tracking-wide mb-1">Action Plan</div>
                          <div className="steps-value-mobile text-2xl font-bold leading-none">2/3</div>
                          <div className="steps-text-mobile text-[11px] text-slate-400 mt-1">Steps Complete</div>
                        </div>
                      </div>

                      {/* Action Steps */}
                      <div className="card-mobile bg-white rounded-xl p-3.5 mb-3 shadow-sm relative" data-feature-mobile="action-plan">
                        <h4 className="text-[13px] font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Your Legal Action Plan
                        </h4>
                        
                        <div className="step-item-mobile flex items-center gap-2.5 py-2.5 border-b border-slate-100">
                          <div className="step-icon-mobile w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100 text-slate-400">
                            <Calendar className="w-3 h-3" />
                          </div>
                          <div className="step-content-mobile flex-1 min-w-0">
                            <div className="step-name-mobile text-xs font-medium text-slate-900">Complete Business Profile</div>
                          </div>
                          <button className="step-btn-mobile text-[10px] py-1.5 px-2.5 rounded-md border-none cursor-pointer flex-shrink-0 bg-emerald-600 text-white">Go →</button>
                        </div>

                        <div className="step-item-mobile flex items-center gap-2.5 py-2.5 border-b border-slate-100">
                          <div className="step-icon-mobile w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-600 text-white">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                          <div className="step-content-mobile flex-1 min-w-0">
                            <div className="step-name-mobile text-xs font-medium text-slate-900">Scan Website Compliance</div>
                            <div className="step-status-mobile text-[9px] font-semibold text-emerald-600">COMPLETED</div>
                          </div>
                          <button className="step-btn-mobile text-[10px] py-1.5 px-2.5 rounded-md border border-slate-200 cursor-pointer flex-shrink-0 bg-transparent text-slate-500">View</button>
                        </div>

                        <div className="step-item-mobile flex items-center gap-2.5 py-2.5">
                          <div className="step-icon-mobile w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-600 text-white">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                          <div className="step-content-mobile flex-1 min-w-0">
                            <div className="step-name-mobile text-xs font-medium text-slate-900">Upload and Analyze Your Current Documents</div>
                            <div className="step-status-mobile text-[9px] font-semibold text-emerald-600">COMPLETED</div>
                          </div>
                          <button className="step-btn-mobile text-[10px] py-1.5 px-2.5 rounded-md border border-slate-200 cursor-pointer flex-shrink-0 bg-transparent text-slate-500">Review</button>
                        </div>
                      </div>

                      {/* Documents */}
                      <div className="card-mobile bg-white rounded-xl p-3.5 mb-3 shadow-sm relative" data-feature-mobile="documents">
                        <h4 className="text-[13px] font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-slate-500" />
                          Your Legal Documents
                        </h4>
                        <p className="documents-subtitle-mobile text-[11px] text-slate-500 mb-3">Documents tailored to your business.</p>

                        <div className="doc-item-mobile flex items-center gap-2.5 py-2.5 border-b border-slate-100">
                          <div className="doc-icon-mobile w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="doc-content-mobile flex-1 min-w-0">
                            <div className="doc-name-mobile text-xs font-medium text-slate-900 flex items-center gap-1.5 flex-wrap">
                              Social Media Disclaimer
                              <span className="doc-badge-mobile text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase bg-emerald-100 text-emerald-700">READY</span>
                            </div>
                            <div className="doc-desc-mobile text-[10px] text-slate-400 mt-0.5">Protect from social media liability.</div>
                          </div>
                          <button className="doc-btn-mobile bg-emerald-600 text-white border-none py-1.5 px-2.5 rounded-md text-[10px] font-medium flex-shrink-0">Generate</button>
                        </div>

                        <div className="doc-item-mobile flex items-center gap-2.5 py-2.5 border-b border-slate-100">
                          <div className="doc-icon-mobile w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="doc-content-mobile flex-1 min-w-0">
                            <div className="doc-name-mobile text-xs font-medium text-slate-900 flex items-center gap-1.5 flex-wrap">
                              Photo Release Form
                              <span className="doc-badge-mobile text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase bg-emerald-100 text-emerald-700">READY</span>
                            </div>
                            <div className="doc-desc-mobile text-[10px] text-slate-400 mt-0.5">Permission for marketing photos.</div>
                          </div>
                          <button className="doc-btn-mobile bg-emerald-600 text-white border-none py-1.5 px-2.5 rounded-md text-[10px] font-medium flex-shrink-0">Generate</button>
                        </div>

                        <div className="doc-item-mobile flex items-center gap-2.5 py-2.5">
                          <div className="doc-icon-mobile w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="doc-content-mobile flex-1 min-w-0">
                            <div className="doc-name-mobile text-xs font-medium text-slate-900 flex items-center gap-1.5 flex-wrap">
                              Waiver of Liability
                              <span className="doc-badge-mobile text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase bg-amber-100 text-amber-700">REVIEW</span>
                            </div>
                            <div className="doc-desc-mobile text-[10px] text-slate-400 mt-0.5">Standard protection for services.</div>
                          </div>
                          <button className="doc-btn-mobile bg-slate-500 text-white border-none py-1.5 px-2.5 rounded-md text-[10px] font-medium flex-shrink-0">Schedule</button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Nav */}
                    <div className="bottom-nav-mobile absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-5 pt-2.5 pb-6 flex justify-around" data-feature-mobile="nav">
                      <a href="#" className="nav-item-mobile flex flex-col items-center gap-1 text-emerald-600 text-[10px] no-underline">
                        <Home className="w-5 h-5" />
                        Overview
                      </a>
                      <a href="#" className="nav-item-mobile flex flex-col items-center gap-1 text-slate-400 text-[10px] no-underline">
                        <FileText className="w-5 h-5" />
                        Vault
                      </a>
                      <a href="#" className="nav-item-mobile flex flex-col items-center gap-1 text-slate-400 text-[10px] no-underline">
                        <Shield className="w-5 h-5" />
                        Profile
                      </a>
                    </div>

                    {/* Highlight Overlay */}
                    <div className="highlight-overlay-mobile absolute border-[3px] border-emerald-600 rounded-2xl pointer-events-none opacity-0 transition-all duration-500 z-[100] shadow-[0_0_0_4px_rgba(13,148,136,0.15),0_0_30px_rgba(13,148,136,0.2)]" ref={mobileHighlightRef}></div>

                    {/* Tap Indicator */}
                    <div className="tap-indicator-mobile absolute w-10 h-10 rounded-full bg-emerald-600/30 pointer-events-none z-[200] opacity-0 scale-0 transition-all duration-300" ref={mobileTapRef}></div>
                  </div>
                </div>

                {/* Tooltip (outside phone) */}
                <div className="tooltip-mobile absolute left-1/2 -translate-x-1/2 -bottom-[90px] bg-slate-900 text-white px-4.5 py-3.5 rounded-xl text-[13px] w-[calc(100%-24px)] max-w-[340px] opacity-0 transition-all duration-400 z-[101] shadow-2xl" ref={mobileTooltipRef}>
                  <div className="tooltip-title-mobile font-semibold mb-1 flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
                    <span id="tooltip-title-text-mobile"></span>
                  </div>
                  <div className="tooltip-text-mobile text-slate-400 text-xs leading-relaxed" id="tooltip-text-mobile"></div>
                </div>

                {/* Progress Dots */}
                <div className="progress-container-mobile w-full flex justify-center items-center gap-2 mt-5">
                  {mobileSteps.map((_, index) => (
                    <div 
                      key={index}
                      className={`progress-dot-mobile w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${currentStepMobile === index ? 'bg-emerald-600 scale-125' : 'bg-slate-200'}`}
                      onClick={() => {
                        setCurrentStepMobile(index);
                        const step = mobileSteps[index];
                        const element = document.querySelector(`[data-feature-mobile="${step.feature}"]`);
                        const highlight = mobileHighlightRef.current;
                        const tooltip = mobileTooltipRef.current;
                        const tap = mobileTapRef.current;
                        const phoneScreen = phoneScreenRef.current;
                        
                        if (!element || !highlight || !tooltip || !tap || !phoneScreen) return;

                        // Get current position without scrolling
                        const rect = element.getBoundingClientRect();
                        const screenRect = phoneScreen.getBoundingClientRect();

                        // Only show highlight if element is visible
                        const isVisible = rect.top >= screenRect.top && rect.bottom <= screenRect.bottom;
                        
                        if (isVisible) {
                          highlight.style.left = (rect.left - screenRect.left - 6) + 'px';
                          highlight.style.top = (rect.top - screenRect.top - 6) + 'px';
                          highlight.style.width = (rect.width + 12) + 'px';
                          highlight.style.height = (rect.height + 12) + 'px';
                          highlight.classList.add('active');

                          tap.style.left = (rect.left - screenRect.left + rect.width / 2 - 20) + 'px';
                          tap.style.top = (rect.top - screenRect.top + rect.height / 2 - 20) + 'px';
                          tap.classList.remove('active');
                          setTimeout(() => tap.classList.add('active'), 50);
                        } else {
                          highlight.classList.remove('active');
                          tap.classList.remove('active');
                        }

                        // Always update tooltip
                        const tooltipTitle = tooltip.querySelector('#tooltip-title-text-mobile');
                        const tooltipText = tooltip.querySelector('#tooltip-text-mobile');
                        if (tooltipTitle) tooltipTitle.textContent = step.title;
                        if (tooltipText) tooltipText.textContent = step.text;
                        tooltip.classList.add('active');
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Dashboard Walkthrough */}
            <div className="hidden md:block dashboard-walkthrough">
              <div className="dashboard-frame" ref={dashboardFrameRef}>
                {/* Browser Chrome */}
                <div className="browser-chrome">
                  <div className="browser-dots">
                    <div className="browser-dot red"></div>
                    <div className="browser-dot yellow"></div>
                    <div className="browser-dot green"></div>
                  </div>
                  <div className="browser-url">app.consciouscounsel.com/dashboard</div>
                </div>

                {/* Dashboard Layout */}
                <div className="dashboard-layout">
                  {/* Sidebar */}
                  <div className="sidebar" data-feature="sidebar">
                    <div className="sidebar-logo">
                      <div className="sidebar-logo-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                      </div>
                      Conscious Counsel
                    </div>
                    <ul className="sidebar-nav">
                      <li>
                        <a href="#" className="active">
                          <Home className="w-4 h-4" />
                          Overview
                        </a>
                      </li>
                      <li>
                        <a href="#">
                          <FileText className="w-4 h-4" />
                          Document Vault
                        </a>
                      </li>
                      <li>
                        <a href="#">
                          <Shield className="w-4 h-4" />
                          My Profile
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* Main Content */}
                  <div className="main-content">
                    {/* Header */}
                    <div className="dashboard-header">
                      <div>
                        <h1 className="dashboard-title">Overview</h1>
                        <p className="dashboard-subtitle">Your legal roadmap and current status.</p>
                      </div>
                      <div className="legal-health-badge" data-feature="health">
                        <div>
                          <div className="legal-health-text">LEGAL HEALTH</div>
                          <div className="legal-health-status">Good</div>
                        </div>
                        <div className="legal-health-icon">
                          <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                      </div>
                    </div>

                    {/* Profile Card */}
                    <div className="card profile-card" data-feature="profile">
                      <div className="profile-card-header">
                        <div>
                          <div className="recommended-badge">⟳ RECOMMENDED NEXT STEP</div>
                          <h3>Complete Your Business Profile</h3>
                          <p>We need a few more details to give you accurate legal recommendations.</p>
                        </div>
                        <button className="btn-primary">
                          Complete Profile
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Action Plan */}
                    <div className="card" data-feature="action-plan">
                      <div className="action-plan">
                        <div className="action-plan-main">
                          <div className="action-header">
                            <div className="action-title">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Your Legal Action Plan
                            </div>
                            <span className="steps-badge">2/3 STEPS DONE</span>
                          </div>
                          <p className="action-subtitle">Complete these steps to minimize your liability.</p>
                          
                          <div className="step-item">
                            <div className="step-icon pending">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div className="step-content">
                              <div className="step-name">Complete Business Profile</div>
                              <div className="step-desc">Finalize your business details to customize your legal documents.</div>
                            </div>
                            <button className="btn-primary" style={{padding: '6px 14px', fontSize: '12px'}}>Complete Profile →</button>
                          </div>

                          <div className="step-item">
                            <div className="step-icon complete">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="step-content">
                              <div className="step-name">Scan Website Compliance</div>
                              <div className="step-desc">View your previous scan results.</div>
                            </div>
                            <span className="step-status">COMPLETED</span>
                            <button className="btn-outline">View Results</button>
                          </div>

                          <div className="step-item">
                            <div className="step-icon complete">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="step-content">
                              <div className="step-name">Upload and Analyze Your Current Documents</div>
                              <div className="step-desc">Upload your existing waivers or contracts and have them analyzed for loopholes.</div>
                            </div>
                            <span className="step-status">COMPLETED</span>
                            <button className="btn-outline">Review Again</button>
                          </div>
                        </div>

                        <div className="action-plan-sidebar">
                          <div className="risk-score-card" data-feature="risk">
                            <div className="risk-score-label">Risk Score</div>
                            <div className="risk-score-value">0</div>
                            <div className="risk-score-status">LOW EXPOSURE</div>
                          </div>
                          <button className="btn-call">
                            <Phone className="w-4 h-4 text-emerald-600" />
                            Book Free Call
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Documents Section */}
                    <div className="documents-section" data-feature="documents">
                      <div className="documents-header">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <h3>All the Legal Documents Your Business Needs</h3>
                      </div>
                      <p className="documents-subtitle">Based on your business profile, these are the exact agreements, waivers, and policies recommended for your protection.</p>

                      <div className="doc-item">
                        <div className="doc-icon">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="doc-content">
                          <div className="doc-name">
                            Social Media Disclaimer
                            <span className="doc-badge ready">READY</span>
                          </div>
                          <div className="doc-desc">Protect your business from social media liability.</div>
                        </div>
                        <div className="doc-actions">
                          <button className="btn-generate">Generate Personalized</button>
                        </div>
                      </div>

                      <div className="doc-item">
                        <div className="doc-icon">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="doc-content">
                          <div className="doc-name">
                            Photo Release Form
                            <span className="doc-badge ready">READY</span>
                          </div>
                          <div className="doc-desc">Permission to use client photos for marketing.</div>
                        </div>
                        <div className="doc-actions">
                          <button className="btn-generate">Generate Personalized</button>
                        </div>
                      </div>

                      <div className="doc-item">
                        <div className="doc-icon">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="doc-content">
                          <div className="doc-name">
                            Basic Waiver of Liability
                            <span className="doc-badge review">LAWYER REVIEW</span>
                          </div>
                          <div className="doc-desc">Standard protection for physical activities.</div>
                        </div>
                        <div className="doc-actions">
                          <button className="btn-outline">Schedule Review</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Highlight Overlay */}
                <div className="highlight-overlay" ref={highlightRef}></div>

                {/* Tooltip */}
                <div className="tooltip" ref={tooltipRef}>
                  <div className="tooltip-title">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
                    <span id="tooltip-title-text"></span>
                  </div>
                  <div className="tooltip-text" id="tooltip-text"></div>
                </div>

                {/* Cursor */}
                <svg className="demo-cursor" ref={cursorRef} viewBox="0 0 24 24" fill="none">
                  <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 00-.85.36z" fill="#1e293b" stroke="#fff" strokeWidth="1.5"/>
                </svg>
              </div>

              {/* Progress Dots */}
              <div className="progress-container">
                {steps.map((_, index) => (
                  <div 
                    key={index}
                    className={`progress-dot ${currentStep === index ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentStep(index);
                      const step = steps[index];
                      const element = document.querySelector(`[data-feature="${step.feature}"]`);
                      const highlight = highlightRef.current;
                      const tooltip = tooltipRef.current;
                      const cursor = cursorRef.current;
                      const frame = dashboardFrameRef.current;
                      
                      if (!element || !highlight || !tooltip || !cursor || !frame) return;

                      const rect = element.getBoundingClientRect();
                      const containerRect = frame.getBoundingClientRect();

                      highlight.style.left = (rect.left - containerRect.left - 8) + 'px';
                      highlight.style.top = (rect.top - containerRect.top - 8) + 'px';
                      highlight.style.width = (rect.width + 16) + 'px';
                      highlight.style.height = (rect.height + 16) + 'px';
                      highlight.classList.add('active');

                      const tooltipTitle = tooltip.querySelector('#tooltip-title-text');
                      const tooltipText = tooltip.querySelector('#tooltip-text');
                      if (tooltipTitle) tooltipTitle.textContent = step.title;
                      if (tooltipText) tooltipText.textContent = step.text;

                      tooltip.classList.remove('left', 'right', 'top', 'bottom');
                      tooltip.classList.add(step.position);

                      const tooltipRect = tooltip.getBoundingClientRect();
                      let tooltipX, tooltipY;

                      switch(step.position) {
                        case 'left':
                          tooltipX = rect.left - containerRect.left - tooltipRect.width - 24;
                          tooltipY = rect.top - containerRect.top + (rect.height / 2) - 40;
                          break;
                        case 'right':
                          tooltipX = rect.right - containerRect.left + 24;
                          tooltipY = rect.top - containerRect.top + (rect.height / 2) - 40;
                          break;
                        case 'top':
                          tooltipX = rect.left - containerRect.left + (rect.width / 2) - (tooltipRect.width / 2);
                          tooltipY = rect.top - containerRect.top - tooltipRect.height - 24;
                          break;
                        case 'bottom':
                          tooltipX = rect.left - containerRect.left + (rect.width / 2) - (tooltipRect.width / 2);
                          tooltipY = rect.bottom - containerRect.top + 24;
                          break;
                      }

                      tooltip.style.left = tooltipX + 'px';
                      tooltip.style.top = tooltipY + 'px';
                      tooltip.classList.add('active');

                      cursor.style.left = (rect.left - containerRect.left + rect.width / 2) + 'px';
                      cursor.style.top = (rect.top - containerRect.top + rect.height / 2) + 'px';
                      cursor.classList.add('active');
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Highlight Box */}
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                    <Sparkles className="w-4 h-4" />
                    Powered by AI
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    Everything You Need, <span className="text-emerald-400">All in One Place</span>
                  </h3>
                  <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                    Your dashboard automatically analyzes your business profile, scans your website, tracks your documents, and tells you exactly what to do next. No legal expertise required.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      "Real-time risk assessment",
                      "Automated compliance tracking",
                      "Personalized document recommendations",
                      "Smart deadline reminders"
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-slate-200">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default DashboardShowcase;
