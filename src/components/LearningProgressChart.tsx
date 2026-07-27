import React, { useState, useMemo } from "react";
import { TrendingUp, Sparkles, CheckCircle2, Clock, Layers, Milestone } from "lucide-react";
import { ProgressHistoryItem } from "../lib/firestoreService";
import { Roadmap } from "../types";

interface LearningProgressChartProps {
  history: ProgressHistoryItem[];
  loading?: boolean;
  roadmap?: Roadmap | null;
}

function formatDateLabel(ts: any): string {
  if (!ts || ts === "Start") return "Start";
  if (ts === "Now") return "Now";
  let date: Date;
  if (typeof ts.toDate === "function") {
    date = ts.toDate();
  } else if (ts.seconds) {
    date = new Date(ts.seconds * 1000);
  } else if (typeof ts === "string" || typeof ts === "number") {
    date = new Date(ts);
  } else if (ts instanceof Date) {
    date = ts;
  } else {
    return "Start";
  }

  if (isNaN(date.getTime())) return "Start";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatFullDateTime(ts: any): string {
  if (!ts || ts === "Start") return "Initial Baseline (Start)";
  if (ts === "Now") return "Current Progress";
  let date: Date;
  if (typeof ts.toDate === "function") {
    date = ts.toDate();
  } else if (ts.seconds) {
    date = new Date(ts.seconds * 1000);
  } else if (typeof ts === "string" || typeof ts === "number") {
    date = new Date(ts);
  } else if (ts instanceof Date) {
    date = ts;
  } else {
    return "Start";
  }

  if (isNaN(date.getTime())) return "Start";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export const LearningProgressChart: React.FC<LearningProgressChartProps> = ({
  history,
  loading = false,
  roadmap
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Derive metrics strictly from real Firestore data or roadmap
  const latestSnapshot = history.length > 0 ? history[history.length - 1] : null;

  const currentPct = latestSnapshot 
    ? latestSnapshot.completionPercentage 
    : (roadmap ? roadmap.overallProgress : 0);

  const totalSkills = latestSnapshot 
    ? latestSnapshot.totalSkills 
    : (roadmap ? roadmap.modules.length : 0);

  const completedSkillsCount = latestSnapshot 
    ? latestSnapshot.completedSkillsCount 
    : (roadmap ? roadmap.modules.filter(m => m.status === "Mastered").length : 0);

  // Construct chart display points ensuring the trajectory ALWAYS starts cleanly at 0%
  // and subsequent points correspond to each completed module in order.
  const chartPoints = useMemo(() => {
    const points: ProgressHistoryItem[] = [];

    // Total skills count
    const totalMods = roadmap?.modules.length 
      ? roadmap.modules.length 
      : (latestSnapshot?.totalSkills || 8);

    // Get list of mastered modules from roadmap if available
    const masteredMods = roadmap?.modules.filter(m => m.status === "Mastered") || [];

    // 1. Point 0: Always Baseline / Path Initialized
    let startTimestamp = "Start";
    if (history.length > 0 && history[0].timestamp) {
      startTimestamp = history[0].timestamp;
    }

    points.push({
      id: "baseline_start",
      completionPercentage: 0,
      completedSkillsCount: 0,
      totalSkills: totalMods,
      completedSkills: [],
      currentSkill: "Path Initialized",
      timestamp: startTimestamp
    });

    // 2. Build milestone points for each completed module in sequence
    if (masteredMods.length > 0) {
      masteredMods.forEach((mod, idx) => {
        const completedCount = idx + 1;
        const pct = Math.round((completedCount / totalMods) * 100);

        // Look for matching snapshot in history for timestamp if available
        const matchingHistory = history.find(
          h => h.completedSkillsCount === completedCount || 
               (h.completedSkills && h.completedSkills.includes(mod.title))
        );

        const timestamp = matchingHistory?.timestamp || matchingHistory?.createdAt || new Date().toISOString();

        points.push({
          id: `mod_milestone_${idx}_${mod.id || idx}`,
          completionPercentage: pct,
          completedSkillsCount: completedCount,
          totalSkills: totalMods,
          completedSkills: masteredMods.slice(0, completedCount).map(m => m.title),
          currentSkill: mod.title,
          timestamp: timestamp
        });
      });
    } else if (history.length > 0) {
      // Fallback if roadmap is not passed but history snapshots exist
      history.forEach((h, idx) => {
        if (h.completionPercentage > 0 || h.completedSkillsCount > 0) {
          const count = h.completedSkillsCount || (h.completedSkills ? h.completedSkills.length : 1);
          const skillName = h.currentSkill || (h.completedSkills && h.completedSkills[h.completedSkills.length - 1]) || `Skill ${count}`;
          points.push({
            id: h.id || `hist_${idx}`,
            completionPercentage: h.completionPercentage,
            completedSkillsCount: count,
            totalSkills: h.totalSkills || totalMods,
            completedSkills: h.completedSkills || [],
            currentSkill: skillName,
            timestamp: h.timestamp || h.createdAt || "Now"
          });
        }
      });
    }

    return points;
  }, [history, roadmap, latestSnapshot]);

  // Growth calculation from starting 0% to latest point
  const firstPoint = chartPoints[0];
  const lastPoint = chartPoints[chartPoints.length - 1];
  const progressChangePct = lastPoint ? lastPoint.completionPercentage - firstPoint.completionPercentage : 0;

  return (
    <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col gap-6 w-full border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm transition-colors duration-200">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="text-[var(--color-primary)] w-5 h-5" />
            <h3 className="text-xl font-bold text-[var(--text-main)]">Learning Progress</h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Real-time trajectory graph tracking skill mastery from 0% baseline up to current path progress.
          </p>
        </div>

        {chartPoints.length > 0 && (
          <div className="flex items-center gap-2 bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
            <span className="text-[var(--text-muted)] font-mono">
              {chartPoints.length} milestone {chartPoints.length === 1 ? "point" : "points"}
            </span>
          </div>
        )}
      </div>

      {/* Summary Metrics Cards with Adaptive Contrast for Light & Dark Mode */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Current Completion */}
        <div className="bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col justify-between transition-colors duration-200">
          <span className="text-[11px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider">Completion Rate</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl md:text-3xl font-extrabold text-[var(--text-main)]">{currentPct}%</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
              Active Path
            </span>
          </div>
        </div>

        {/* Metric 2: Skills Mastered */}
        <div className="bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col justify-between transition-colors duration-200">
          <span className="text-[11px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider">Skills Mastered</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl md:text-3xl font-extrabold text-[var(--text-main)]">
              {completedSkillsCount} <span className="text-sm font-normal text-[var(--text-muted)]">/ {totalSkills}</span>
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 opacity-90" />
          </div>
        </div>

        {/* Metric 3: Total Progress Growth */}
        <div className="bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col justify-between transition-colors duration-200">
          <span className="text-[11px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider">Overall Trajectory</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {progressChangePct >= 0 ? `+${progressChangePct}%` : `${progressChangePct}%`}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono font-medium">Gain from 0%</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative w-full bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] rounded-2xl p-4 md:p-6 min-h-[270px] flex flex-col justify-between transition-colors duration-200 overflow-hidden">
        
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 text-[var(--text-muted)]">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin"></div>
            <span className="text-xs font-mono">Loading progress trajectory...</span>
          </div>
        ) : (
          /* MULTI-MILESTONE PROGRESS TRAJECTORY CHART */
          <div className="relative w-full flex flex-col justify-between pt-2 pb-2 overflow-hidden">
            {/* SVG Chart Layer */}
            <div className="relative flex-1 w-full h-48 md:h-56 overflow-hidden">
              <svg 
                className="w-full h-full" 
                viewBox="0 0 500 160" 
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="progressAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" style={{ stopColor: "var(--color-primary)", stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: "var(--color-primary)", stopOpacity: 0.0 }} />
                  </linearGradient>
                </defs>

                {/* Y-Axis horizontal gridlines (0%, 25%, 50%, 75%, 100%) */}
                {[0, 25, 50, 75, 100].map((val) => {
                  const y = 138 - (val / 100) * 116;
                  return (
                    <g key={val}>
                      <line 
                        x1="38" 
                        y1={y} 
                        x2="475" 
                        y2={y} 
                        style={{ stroke: "var(--border-color)", opacity: 0.7 }}
                        strokeWidth="1" 
                        strokeDasharray="3 3" 
                      />
                      <text 
                        x="32" 
                        y={y + 3.5} 
                        style={{ fill: "var(--text-muted)" }}
                        fontSize="10" 
                        fontWeight="600"
                        fontFamily="monospace" 
                        textAnchor="end"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* Calculate point coordinates */}
                {(() => {
                  const paddingX = 45;
                  const widthAvailable = 420;
                  const denominator = chartPoints.length > 1 ? chartPoints.length - 1 : 1;

                  const points = chartPoints.map((item, idx) => {
                    const x = paddingX + (idx / denominator) * widthAvailable;
                    const y = 138 - (Math.min(100, Math.max(0, item.completionPercentage)) / 100) * 116;
                    return { x, y, item, idx };
                  });

                  // Build SVG path string
                  const pathD = points.reduce((acc, p, idx) => {
                    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                  }, "");

                  // Closed area path string for background gradient fill
                  const areaD = `${pathD} L ${points[points.length - 1].x} 138 L ${points[0].x} 138 Z`;

                  return (
                    <g>
                      {/* Area Fill Gradient */}
                      <path d={areaD} fill="url(#progressAreaGradient)" />

                      {/* Stroke Line */}
                      <path 
                        d={pathD} 
                        fill="none" 
                        style={{ stroke: "var(--color-primary)" }}
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />

                      {/* Interactive Data Nodes */}
                      {points.map((p) => {
                        const isHovered = hoveredIdx === p.idx;
                        return (
                          <g 
                            key={p.idx} 
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredIdx(p.idx)}
                            onMouseLeave={() => setHoveredIdx(null)}
                          >
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r={isHovered ? "7.5" : "5.5"} 
                              style={{ 
                                fill: "var(--bg-surface)", 
                                stroke: "var(--color-primary)" 
                              }}
                              strokeWidth={isHovered ? "3" : "2.5"}
                              className="transition-all duration-200"
                            />
                            {isHovered && (
                              <circle 
                                cx={p.x} 
                                cy={p.y} 
                                r="12" 
                                style={{ fill: "var(--color-primary)", opacity: 0.2 }}
                              />
                            )}
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}
              </svg>

              {/* Hover Tooltip Popup */}
              {hoveredIdx !== null && chartPoints[hoveredIdx] && (() => {
                const total = chartPoints.length;
                const denominator = total > 1 ? total - 1 : 1;
                const completion = chartPoints[hoveredIdx].completionPercentage;
                const rawXPct = ((45 + (hoveredIdx / denominator) * 420) / 500) * 100;
                const rawYPct = ((138 - (Math.min(100, Math.max(0, completion)) / 100) * 116) / 160) * 100;

                let alignTransformX = "-translate-x-1/2";
                if (hoveredIdx === 0 || rawXPct < 25) {
                  alignTransformX = "translate-x-0";
                } else if (hoveredIdx === total - 1 || rawXPct > 75) {
                  alignTransformX = "-translate-x-full";
                }

                const showBelow = rawYPct < 35;
                const alignTransformY = showBelow ? "translate-y-4" : "-translate-y-full -translate-y-3";

                return (
                  <div 
                    className={`absolute z-20 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl p-3 shadow-2xl backdrop-blur-md pointer-events-none text-xs transform transition-all duration-150 ${alignTransformX} ${alignTransformY}`}
                    style={{
                      left: `${Math.max(2, Math.min(98, rawXPct))}%`,
                      top: `${rawYPct}%`
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] pb-1.5 mb-1.5 font-mono">
                      <span className="text-[10px] text-[var(--text-muted)] font-medium">
                        {formatFullDateTime(chartPoints[hoveredIdx].timestamp)}
                      </span>
                      <span className="font-bold text-[var(--color-primary)]">
                        {chartPoints[hoveredIdx].completionPercentage}%
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-main)] font-semibold">
                      {chartPoints[hoveredIdx].completedSkillsCount} of {chartPoints[hoveredIdx].totalSkills} skills mastered
                    </div>
                    {chartPoints[hoveredIdx].currentSkill && (
                      <div className="text-[10px] text-[var(--text-muted)] mt-1 truncate max-w-[190px]">
                        Module: <span className="text-[var(--text-main)] font-medium">{chartPoints[hoveredIdx].currentSkill}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* X-Axis Date/Time Labels aligned under SVG coordinates */}
            <div className="relative w-full h-8 mt-3 border-t border-[var(--border-color)] pt-1 overflow-hidden">
              {chartPoints.map((item, idx) => {
                const total = chartPoints.length;
                const shouldShow = total <= 6 || idx === 0 || idx === total - 1 || idx % Math.ceil(total / 5) === 0;
                
                if (!shouldShow) return null;
                
                const denominator = total > 1 ? total - 1 : 1;
                const xPct = ((45 + (idx / denominator) * 420) / 500) * 100;
                
                let alignClass = "-translate-x-1/2";
                if (idx === 0) {
                  alignClass = "translate-x-0";
                } else if (idx === total - 1) {
                  alignClass = "-translate-x-full";
                }

                return (
                  <span 
                    key={idx} 
                    style={{ 
                      left: `${xPct}%`,
                      color: hoveredIdx === idx ? "var(--color-primary)" : "var(--text-muted)" 
                    }}
                    className={`absolute top-2 transform ${alignClass} whitespace-nowrap text-[11px] font-mono font-semibold cursor-pointer transition-colors duration-150 ${hoveredIdx === idx ? "font-bold scale-105" : "hover:text-[var(--text-main)]"}`}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {formatDateLabel(item.timestamp)}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
