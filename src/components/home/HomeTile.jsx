import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export default function HomeTile({ title, subtext, page, icon: Icon, image, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Link to={createPageUrl(page)} className="block group">
        <div className="relative overflow-hidden rounded-2xl h-56 sm:h-60 shadow-xl border border-white/20 group-hover:border-white/35 transition-all duration-300">
          {/* Background image — much more visible */}
          {image && (
            <img
              src={image}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
            />
          )}

          {/* Gradient overlay — strong bottom fade for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

          {/* Subtle warm tint on hover to match sunset theme */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/0 to-amber-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Content */}
          <div className="relative h-full flex flex-col justify-end p-5">
            {/* Icon badge */}
            {Icon && (
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center mb-3 shadow-md">
                <Icon className="w-4.5 h-4.5 text-white" />
              </div>
            )}

            <h3 className="text-lg font-bold text-white drop-shadow-md leading-tight mb-1">{title}</h3>

            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-white/85 font-medium drop-shadow-sm">{subtext}</p>
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 border border-white/30 flex items-center justify-center group-hover:bg-amber-500/60 group-hover:border-amber-400/60 transition-all duration-200">
                <ChevronRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform duration-200" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}