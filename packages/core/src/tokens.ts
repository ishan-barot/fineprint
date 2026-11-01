// single source of truth for colors and radii across web and mobile
export const tokens = {
  color: {
    bg: "#0B0F14",
    surface: "#121821",
    text: "#E8EEF5",
    muted: "#8A97A8",
    primary: "#4F8CFF",
    good: "#2FBF71",
    warn: "#F5A524",
    bad: "#F05252",
  },
  radius: { sm: 6, md: 10, lg: 16 },
} as const;