import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { tokens } from "@fineprint/core";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      {/* hide the default "index" header, every screen draws its own */}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.color.bg } }} />
    </>
  );
}