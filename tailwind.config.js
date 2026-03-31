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
    // Dark text for light backgrounds
    "text-orange-700", "text-amber-700", "text-rose-700", "text-sky-700",
    "text-violet-700", "text-teal-700", "text-lime-700", "text-red-700",
    "text-pink-700", "text-cyan-700", "text-indigo-700",
    // Light badge backgrounds
    "bg-orange-100", "bg-amber-100", "bg-rose-100", "bg-sky-100",
    "bg-violet-100", "bg-teal-100", "bg-lime-100", "bg-red-100",
    "bg-pink-100", "bg-cyan-100", "bg-indigo-100",
    // Badge borders
    "border-orange-300", "border-amber-300", "border-rose-300", "border-sky-300",
    "border-violet-300", "border-teal-300", "border-lime-300", "border-red-300",
    "border-pink-300", "border-cyan-300", "border-indigo-300",
  ],
  plugins: [require("tailwindcss-animate")],
}