/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f2137",
        navy: "#123b66",
        teal: "#0e7490",
        mist: "#edf5fb",
        saffron: "#e59c26",
      },
      boxShadow: {
        panel: "0 18px 45px rgba(15, 33, 55, 0.08)",
      },
    },
  },
  plugins: [],
};
