import React from "react";

export default function ServiceSelector({ services, selectedService, onSelectService }) {
  return (
    <div className="flex flex-wrap gap-2">
      {services.map(service => (
        <button
          key={service}
          onClick={() => onSelectService(service)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedService === service
              ? "bg-white/18 border border-white/25 text-white"
              : "bg-white/8 border border-white/15 text-white/65 hover:bg-white/12"
          }`}
        >
          {service}
        </button>
      ))}
    </div>
  );
}