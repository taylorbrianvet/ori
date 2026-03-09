import React from "react";

export default function SectionHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-white/80" />
          </div>
        )}
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-white/45 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}