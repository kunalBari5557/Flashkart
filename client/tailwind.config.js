/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: 1, boxShadow: "0 0 15px rgba(245, 158, 11, 0.6)" },
          "50%": { opacity: 0.6, boxShadow: "0 0 5px rgba(245, 158, 11, 0.2)" },
        },
        urgentPulse: {
          "0%, 100%": { opacity: 1, boxShadow: "0 0 20px rgba(239, 68, 68, 0.8)" },
          "50%": { opacity: 0.5, boxShadow: "0 0 5px rgba(239, 68, 68, 0.2)" },
        }
      },
      animation: {
        "pulse-glow": "pulseGlow 2s infinite ease-in-out",
        "urgent-pulse": "urgentPulse 1.2s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};
