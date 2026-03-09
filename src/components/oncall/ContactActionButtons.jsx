import React from "react";
import { Phone, MessageSquare, Mail } from "lucide-react";

export default function ContactActionButtons({ phone, email, size = "sm" }) {
  const btnClass = size === "sm"
    ? "w-7 h-7 rounded-lg text-xs"
    : "w-9 h-9 rounded-xl text-sm";

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {phone && (
        <a
          href={`tel:${phone}`}
          className={`${btnClass} bg-green-500/10 flex items-center justify-center hover:bg-green-500/25 transition-colors`}
          title="Call"
        >
          <Phone className={size === "sm" ? "w-3 h-3 text-green-600" : "w-4 h-4 text-green-600"} />
        </a>
      )}
      {phone && (
        <a
          href={`sms:${phone}`}
          className={`${btnClass} bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/25 transition-colors`}
          title="Text"
        >
          <MessageSquare className={size === "sm" ? "w-3 h-3 text-blue-500" : "w-4 h-4 text-blue-500"} />
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className={`${btnClass} bg-primary/10 flex items-center justify-center hover:bg-primary/25 transition-colors`}
          title="Email"
        >
          <Mail className={size === "sm" ? "w-3 h-3 text-primary" : "w-4 h-4 text-primary"} />
        </a>
      )}
    </div>
  );
}