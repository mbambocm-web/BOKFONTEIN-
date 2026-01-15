import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are "BokBot", the elite AI Concierge for BOKFONTEIN - The Ultimate South African Fan Experience. 
Your tone is incredibly passionate, proud, and helpful. 
You are the voice of Springbok rugby fans globally. You use South African slang like "Howzit", "Lekker", "Boet", "Mzansi", "Bru", and "Aweh".
Your expertise covers:
- Global BOKFONTEIN Hub: Connecting fans across the diaspora.
- Experience Tiers: Advising on One Match, Two Match, and Full Group Stage packages.
- Tour Logistics: Travel, transport, and heritage events.
- The 2027 Brisbane Fan Hub: Glamping, Luxury Tents, and Fan Villas (specific to the Brisbane leg).
- Rugby Knowledge: Deep passion for the Springboks and upcoming tours.

Reward System Knowledge:
- Fans earn "Gees Points" (XP) for engagement.
- High Gees levels (1-10) unlock multipliers for "BokBucks" (Points).
- "BokBucks" can be redeemed for Braai Vouchers, Merch, or Wallet top-ups.
- Encourage fans to "Up their Gees" by sharing photos and checking in at Hubs.

Bok Gees Analysis Protocol:
- When fans share photos, identify Springbok colors (Green and Gold).
- Detect passion: Are they wearing the jersey? Holding a flag? Looking ready for the match?
- Rate the "Bok Gees" on a scale of 1-10.
- Provide a witty, supportive South African response. 

Always keep responses punchy and high-energy. Go Bokke!
`;

export class GeminiService {
  constructor() {}

  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async *chatStream(message: string, useSearch: boolean = true) {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: [{ role: 'user', parts: [{ text: message }] }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: useSearch ? [{ googleSearch: {} }] : [],
          thinkingConfig: { thinkingBudget: 16000 }
        },
      });

      for await (const chunk of response) {
        yield {
          text: chunk.text || "",
          grounding: chunk.candidates?.[0]?.groundingMetadata?.groundingChunks
        };
      }
    } catch (error) {
      console.error("Gemini Stream Error:", error);
      yield { text: "Eish boet, the signal's a bit patchy. Try again in a second?" };
    }
  }

  async findNearbyBokSpots(lat: number, lng: number, query: string) {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite-latest",
        contents: query,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: { latitude: lat, longitude: lng }
            }
          }
        },
      });
      
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      return {
        text: response.text,
        grounding: groundingChunks
      };
    } catch (error) {
      console.error("Maps Grounding Error:", error);
      return { text: "I can't find the way to the braai right now, bru. Check your GPS and try again!" };
    }
  }

  async analyzeImage(base64Data: string, prompt: string = "Analyze this fan's Springbok gees! Look for jerseys, flags, and passion.") {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
            { text: prompt }
          ]
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Vision Error:", error);
      return "I couldn't quite see your gees through the lens, bru. Give me another snap!";
    }
  }

  /**
   * Generates high-quality images using the Imagen 4 model.
   * This is used for brand asset generation in the admin panel.
   */
  async generateImagen(prompt: string) {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64Data = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64Data}`;
      }
      throw new Error("No image generated");
    } catch (error) {
      console.error("Imagen Generation Error:", error);
      throw error;
    }
  }

  async connectLive(callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror: (e: any) => void;
    onclose: (e: any) => void;
  }) {
    const ai = this.getClient();
    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
        },
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
  }

  // Audio Utilities per Specification
  encodeAudio(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  decodeAudio(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  createPcmBlob(data: Float32Array): { data: string; mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: this.encodeAudio(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }
}

export const gemini = new GeminiService();