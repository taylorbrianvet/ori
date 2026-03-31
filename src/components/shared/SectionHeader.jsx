import React from "react";

export default function SectionHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-200/70 flex items-center justify-center">
            <Icon className="w-4 h-4 text-slate-500" />
          </div>
        )}
        <div>
          <h2 className="text-base font-semibold text-slate-700">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}