import React from "react";

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6 lg:mb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}