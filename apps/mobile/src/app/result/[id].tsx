import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getBill, type SavedBill } from "../../lib/storage";
import { cad, ui } from "../../lib/ui";

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [saved, setSaved] = useState<SavedBill | null | undefined>(undefined);

  useEffect(() => {
    getBill(id).then(setSaved);
  }, [id]);

  return (
    <SafeAreaView style={ui.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={ui.content}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={ui.link}>‹ Back</Text>
        </Pressable>

        {saved === null && <Text style={ui.muted}>{"That bill isn't on this phone anymore."}</Text>}

        {saved && (
          <>
            <Text style={ui.h1} accessibilityRole="header">{saved.bill.carrier}</Text>
            <Text style={ui.muted}>{saved.bill.planName} · {new Date(saved.savedAt).toLocaleDateString()}</Text>

            {saved.flags.length > 0 && (
              <View style={ui.card}>
                <Text style={ui.h2}>Heads up</Text>
                {saved.flags.map((f) => <Text key={f.kind} style={ui.warn}>• {f.message}</Text>)}
              </View>
            )}

            <View style={ui.card}>
              <Text style={ui.h2}>Every charge</Text>
              {saved.bill.lineItems.map((li, i) => (
                <View key={i} style={{ paddingVertical: 6, gap: 2 }}>
                  <View style={ui.between}>
                    <Text style={ui.text}>{li.description}</Text>
                    <Text style={ui.text}>{cad(li.amount)}</Text>
                  </View>
                  <Text style={ui.muted}>{li.explanation}</Text>
                </View>
              ))}
              <View style={ui.between}>
                <Text style={ui.bold}>Total</Text>
                <Text style={ui.bold}>{cad(saved.bill.totalDue)}</Text>
              </View>
            </View>

            <View style={ui.card}>
              <Text style={ui.h2}>Cheaper plans</Text>
              {saved.matches.length === 0 && <Text style={ui.muted}>Nothing cheaper fits your usage. Nice.</Text>}
              {saved.matches.map((p) => (
                <Pressable key={p.id} style={{ paddingVertical: 6, gap: 2 }} onPress={() => Linking.openURL(p.url)} accessibilityRole="link">
                  <View style={ui.between}>
                    <Text style={ui.text}>{p.carrier} {p.name}</Text>
                    <Text style={ui.good}>Save {cad(p.savingsPerYear)}/yr</Text>
                  </View>
                  <Text style={ui.muted}>
                    {cad(p.monthlyPrice)}/mo · {p.dataGB === null ? "Unlimited" : `${p.dataGB} GB`} · checked {p.lastVerified}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}