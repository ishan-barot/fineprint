// ml kit is native so expo go can't load it, only import it when someone picks an image
export async function readImage(uri: string): Promise<string> {
  const { default: TextRecognition } = await import("@react-native-ml-kit/text-recognition");
  const result = await TextRecognition.recognize(uri);
  return result.text;
}