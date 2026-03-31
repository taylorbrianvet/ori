/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)'],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "#2d3a47",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  safelist: [
    "grid-cols-1", "grid-cols-2", "grid-cols-3",
    "text-orange-300", "text-amber-300", "text-rose-300", "text-sky-300",
    "text-violet-300", "text-teal-300", "text-lime-300", "text-red-300",
    "text-pink-300", "text-cyan-300", "text-indigo-300",
    "bg-orange-500/15", "bg-amber-500/15", "bg-rose-500/15", "bg-sky-500/15",
    "bg-violet-500/15", "bg-teal-500/15", "bg-lime-500/15", "bg-red-500/15",
    "bg-pink-500/15", "bg-cyan-500/15", "bg-indigo-500/15",
    "border-orange-400/25", "border-amber-400/25", "border-rose-400/25", "border-sky-400/25",
    "border-violet-400/25", "border-teal-400/25", "border-lime-400/25", "border-red-400/25",
    "border-pink-400/25", "border-cyan-400/25", "border-indigo-400/25",
  ],
  plugins: [require("tailwindcss-animate")],
}