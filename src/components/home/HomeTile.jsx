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
        <div className="relative overflow-hidden rounded-2xl glass-card glass-hover h-48 sm:h-52">
          {image && (
            <img
              src={image}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-105 transform transition-transform"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          <div className="relative h-full flex flex-col justify-end p-5">
            <div className="flex items-center gap-2.5 mb-1.5">
              {Icon && (
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/75 font-medium">{subtext}</p>
              <ChevronRight className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}