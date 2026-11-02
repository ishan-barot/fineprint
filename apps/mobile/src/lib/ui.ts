import { StyleSheet } from "react-native";
import { tokens } from "@fineprint/core";

export const c = tokens.color;
export const cad = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;

// shared styles so every screen looks the same
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  content: { padding: 20, gap: 14, paddingBottom: 48 },
  h1: { color: c.text, fontSize: 34, fontWeight: "700", marginTop: 8 },
  h2: { color: c.text, fontSize: 18, fontWeight: "600" },
  text: { color: c.text, fontSize: 15, flexShrink: 1 },
  bold: { color: c.text, fontSize: 16, fontWeight: "700" },
  muted: { color: c.muted, fontSize: 14, lineHeight: 20 },
  warn: { color: c.warn, fontSize: 15 },
  good: { color: c.good, fontWeight: "600" },
  error: { color: c.bad, fontSize: 15 },
  link: { color: c.primary, fontSize: 16 },
  card: { backgroundColor: c.surface, borderRadius: tokens.radius.lg, padding: 16, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  between: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  button: { backgroundColor: c.primary, borderRadius: tokens.radius.md, padding: 16, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  ghost: { borderColor: c.muted, borderWidth: 1, borderRadius: tokens.radius.md, padding: 14, alignItems: "center" },
  ghostText: { color: c.text, fontSize: 15 },
});