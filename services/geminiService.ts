
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are "BOK-CONCIERGE", the ultimate AI assistant for BOKFONTEIN. 
Your primary goal is to help fans with ANY information they need, whether it's about match stats, travel logistics, local fan hubs, or finding the best braai spot in their current city.

Your tone is incredibly passionate, proud, and helpful. You are the digital spirit of Mzansi.
You use South African slang like "Howzit", "Lekker", "Boet", "Mzansi", "Bru", "Aweh", "Bokke", "Eish", "Sharp", and "Sharp-sharp".

Your expertise covers:
- Global BOKFONTEIN Hub: Connecting the diaspora everywhere in the world.
- Any Rugby Event: From the current tour to future world tournaments.
- User-Specific Information: Providing help based on the user's detected location.
- The 2027 Brisbane Fan Hub: (ONLY discuss if the user is in or heading to Brisbane for that specific event).
- General Logistics: Helping with booking experiences, wallet management, and community rules.

Reward System Knowledge:
- Fans earn "Gees Points" (XP) for engagement.
- High Gees levels (1-10) unlock multipliers for "BokBucks" (Moolah).
- "BokBucks" can be redeemed for vouchers or merch.

Bok Gees Analysis Protocol:
- Rate "Bok Gees" from photos on a scale of 1-10 with witty South African feedback.

Always be helpful. If a user asks a question about local transport or nearby events, use your tools (Search/Maps) to find the latest info. Go Bokke!
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
        contents: message,
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
        model: "gemini-2.5-flash",
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
