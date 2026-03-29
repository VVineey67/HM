import React from "react";

const ICONS = {
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  danger: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  default: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  attendance: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  close: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 4L12 12M4 12L12 4" />
    </svg>
  ),
};

const StatCards = ({ stats, onStatClick, activeFilter }) => {
  const cards = [
    { key: "all",        label: "Total",      value: stats.total,              color: "info",    icon: "info" },
    { key: "Present",   label: "Present",    value: stats.present,            color: "success", icon: "success", pct: stats.total > 0 ? (stats.present / stats.total) * 100 : 0 },
    { key: "Absent",    label: "Absent",     value: stats.absent,             color: "danger",  icon: "danger",  pct: stats.total > 0 ? (stats.absent  / stats.total) * 100 : 0 },
    { key: "Late",      label: "Late",       value: stats.late,               color: "warning", icon: "warning", pct: stats.total > 0 ? (stats.late    / stats.total) * 100 : 0 },
    { key: "avgHours",  label: "Avg Hours",  value: stats.avgHours || "-",    color: "default", icon: "default",  clickable: false },
    { key: "attendance",label: "Attendance", value: `${stats.attendancePct}%`,color: "success", icon: "attendance", clickable: false },
  ];

  return (
    <div className="stat-cards-grid">
      {cards.map((card) => {
        const isSelected = activeFilter === card.key;
        return (
          <div
            key={card.key}
            className={`stat-card color-${card.color} ${card.clickable !== false && onStatClick ? "clickable" : ""} ${isSelected ? "selected" : ""}`}
            onClick={() => card.clickable !== false && onStatClick && onStatClick(card.key)}
          >
            <div className="stat-card-header">
              <div className="stat-label">{card.label}</div>
              {isSelected && card.key !== 'all' && (
                <button
                  className="stat-card-close"
                  onClick={(e) => { e.stopPropagation(); onStatClick("all"); }}
                >
                  {ICONS.close}
                </button>
              )}
              <div className={`stat-icon stat-icon-${card.color}`}>{ICONS[card.icon]}</div>
            </div>
            <div className={`stat-value color-${card.color}`}>{card.value}</div>
            {card.pct !== undefined && (
              <div className="stat-bar"><div className={`stat-bar-fill bg-${card.color}`} style={{ width: `${Math.min(card.pct, 100)}%` }} /></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const GuardStatCards = ({ stats, onStatClick, activeFilter }) => {
  const cards = [
    { key: "all",        label: "Total Guards", value: stats.total,              color: "info",    icon: "info" },
    { key: "Present",   label: "On Duty",      value: stats.present,            color: "success", icon: "success", pct: stats.total > 0 ? (stats.present / stats.total) * 100 : 0 },
    { key: "Absent",    label: "Absent",       value: stats.absent,             color: "danger",  icon: "danger",  pct: stats.total > 0 ? (stats.absent  / stats.total) * 100 : 0 },
    { key: "avgHours",  label: "Avg Duty Hrs", value: stats.avgHours || "-",    color: "default", icon: "default",  clickable: false },
    { key: "attendance",label: "Attendance",   value: `${stats.attendancePct}%`,color: "success", icon: "attendance", clickable: false },
  ];

  return (
    <div className="stat-cards-grid guard-grid">
      {cards.map((card) => {
        const isSelected = activeFilter === card.key;
        return (
          <div key={card.key}
            className={`stat-card color-${card.color} ${card.clickable !== false && onStatClick ? "clickable" : ""} ${isSelected ? "selected" : ""}`}
            onClick={() => card.clickable !== false && onStatClick && onStatClick(card.key)}>
            <div className="stat-card-header">
              <div className="stat-label">{card.label}</div>
               {isSelected && card.key !== 'all' && (
                <button
                  className="stat-card-close"
                  onClick={(e) => { e.stopPropagation(); onStatClick("all"); }}
                >
                  {ICONS.close}
                </button>
              )}
              <div className={`stat-icon stat-icon-${card.color}`}>{ICONS[card.icon]}</div>
            </div>
            <div className={`stat-value color-${card.color}`}>{card.value}</div>
            {card.pct !== undefined && <div className="stat-bar"><div className={`stat-bar-fill bg-${card.color}`} style={{ width: `${Math.min(card.pct, 100)}%` }} /></div>}
          </div>
        );
      })}
    </div>
  );
};

export default StatCards;
