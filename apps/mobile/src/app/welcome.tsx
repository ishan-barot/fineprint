import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { setOnboarded } from "../lib/storage";
import { c, ui } from "../lib/ui";

const STEPS = [
  { title: "Snap or upload your bill", body: "Take a photo of a paper bill or pick a screenshot. No PDF needed." },
  { title: "Every charge in plain English", body: "Fees, add-ons and promo credits explained in one line each." },
  { title: "Find a cheaper plan", body: "We compare your usage to public Canadian plans and show what you'd save per year." },
];

export default function Welcome() {
  async function start() {
    await setOnboarded();
    router.replace("/");
  }

  return (
    <SafeAreaView style={ui.screen}>
      <ScrollView contentContainerStyle={ui.content}>
        <Text style={s.logo} accessibilityRole="header">Fineprint</Text>
        <Text style={s.tagline}>Your phone bill, decoded.</Text>

        {STEPS.map((step, i) => (
          <View key={step.title} style={s.step}>
            <View style={s.num}><Text style={s.numText}>{i + 1}</Text></View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={ui.h2}>{step.title}</Text>
              <Text style={ui.muted}>{step.body}</Text>
            </View>
          </View>
        ))}

        <View style={ui.card}>
          <Text style={ui.h2}>Private by design</Text>
          <Text style={ui.muted}>
            Your bill is read on your phone. Account and phone numbers are masked before anything is sent.
            Past bills are saved only on this device. No account needed.
          </Text>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <Pressable style={ui.button} onPress={start} accessibilityRole="button">
          <Text style={ui.buttonText}>Get started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  logo: { color: c.text, fontSize: 44, fontWeight: "800", marginTop: 32 },
  tagline: { color: c.muted, fontSize: 18, marginBottom: 16 },
  step: { flexDirection: "row", gap: 14, alignItems: "flex-start", paddingVertical: 6 },
  num: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" },
  numText: { color: "#fff", fontWeight: "700" },
  footer: { padding: 20 },
});