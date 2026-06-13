/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#090909",
        ink2: "#111111",
        panel: "#171717",
        panel2: "#1c1c1c",
        line: "rgba(255,255,255,0.08)",
        line2: "rgba(255,255,255,0.04)",
        rl: {
          green: "#30d158",
          yellow: "#ffd60a",
          orange: "#ff9f0a",
          red: "#ff3b30",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont", "SF Pro Display", "Inter",
          "system-ui", "Segoe UI", "sans-serif",
        ],
        mono: ["ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      letterSpacing: {
        label: "0.18em",
      },
      boxShadow: {
        glow: "0 0 60px -10px rgba(255,59,48,0.4)",
        panel: "0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -30px rgba(0,0,0,0.8)",
      },
      backgroundImage: {
        "grid-fade": "radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,0.05), transparent 60%)",
      },
    },
  },
  plugins: [],
};
