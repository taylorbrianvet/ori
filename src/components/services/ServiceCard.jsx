import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function ServiceCard({ service, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Link to={createPageUrl("ServiceDetail") + `?id=${service.id}`}>
        <div className="glass-card glass-hover overflow-hidden group">
          <div className="relative h-36 overflow-hidden">
            {service.service_image_url ? (
              <img
                src={service.service_image_url}
                alt={service.service_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary/30">
                  {service.service_name?.charAt(0)}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{service.service_name}</h3>
                {service.service_subtext && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{service.service_subtext}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}