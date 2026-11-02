import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Redirect, router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { parseBill } from "../lib/api";
import { readImage } from "../lib/ocr";
import { isOnboarded, listBills, saveBill, type SavedBill } from "../lib/storage";
import { c, cad, ui } from "../lib/ui";
import { SAMPLE_BILL } from "../../sample-bill";

export default function Home() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [history, setHistory] = useState<SavedBill[]>([]);
  const [status, setStatus] = useState<"idle" | "reading" | "parsing">("idle");
  const [error, setError] = useState("");

  // reload every time we land back here so new bills show up
  useFocusEffect(
    useCallback(() => {
      isOnboarded().then(setOnboarded);
      listBills().then(setHistory);
    }, []),
  );

  if (onboarded === null) return <View style={ui.screen} />;
  if (!onboarded) return <Redirect href="/welcome" />;

  async function fromImage(source: "camera" | "library") {
    if (source === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) throw new Error("Camera access is off. Turn it on in Settings to snap a bill.");
    }
    const picked =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (picked.canceled) return null;

    setStatus("reading");
    let text: string;
    try {
      text = await readImage(picked.assets[0].uri);
    } catch {
      throw new Error("Reading photos needs the full app build. Tap Try a sample bill for now.");
    }
    if (text.trim().length < 40) throw new Error("Couldn't find much text. Try a flatter photo in good light.");
    return text;
  }

  async function run(getText: () => Promise<string | null>) {
    setError("");
    try {
      const text = await getText();
      if (!text) return; // they backed out, nothing to do
      setStatus("parsing");
      const saved = await saveBill(await parseBill(text));
      router.push(`/result/${saved.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStatus("idle");
    }
  }

  const busy = status !== "idle";

  return (
    <SafeAreaView style={ui.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={ui.content}>
        <Text style={ui.h1} accessibilityRole="header">Fineprint</Text>
        <Text style={ui.muted}>Scan your phone bill. See every charge in plain English and find a cheaper plan.</Text>

        <Pressable style={ui.button} onPress={() => run(() => fromImage("camera"))} disabled={busy} accessibilityRole="button">
          <Text style={ui.buttonText}>Take a photo of a bill</Text>
        </Pressable>
        <Pressable style={ui.ghost} onPress={() => run(() => fromImage("library"))} disabled={busy} accessibilityRole="button">
          <Text style={ui.ghostText}>Choose a screenshot</Text>
        </Pressable>
        <Pressable style={ui.ghost} onPress={() => run(async () => SAMPLE_BILL)} disabled={busy} accessibilityRole="button">
          <Text style={ui.ghostText}>Try a sample bill</Text>
        </Pressable>

        {busy && (
          <View style={ui.row} accessibilityLiveRegion="polite">
            <ActivityIndicator color={c.primary} />
            <Text style={ui.muted}>{status === "reading" ? "Reading on your phone..." : "Decoding charges..."}</Text>
          </View>
        )}
        {!!error && <Text style={ui.error} accessibilityRole="alert">{error}</Text>}

        <Text style={[ui.h2, { marginTop: 12 }]}>Past bills</Text>
        {history.length === 0 ? (
          <Text style={ui.muted}>{"Bills you decode show up here. They're saved only on this phone."}</Text>
        ) : (
          history.map((b) => (
            <Pressable key={b.id} style={ui.card} onPress={() => router.push(`/result/${b.id}`)} accessibilityRole="button">
              <View style={ui.between}>
                <Text style={ui.text}>{b.bill.carrier} · {b.bill.planName}</Text>
                <Text style={ui.bold}>{cad(b.bill.totalDue)}</Text>
              </View>
              <Text style={ui.muted}>
                {new Date(b.savedAt).toLocaleDateString()}
                {b.matches[0] ? ` · save up to ${cad(b.matches[0].savingsPerYear)}/yr` : ""}
              </Text>
            </Pressable>
          ))
        )}

        <Pressable onPress={() => router.push("/welcome")} accessibilityRole="link">
          <Text style={[ui.link, { marginTop: 8 }]}>How Fineprint works</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}