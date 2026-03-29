export type ProviderMessage = {
  role: "system" | "user";
  content: string;
};

export type StreamTextOptions = {
  signal?: AbortSignal;
  temperature?: number;
};

export type GenerateImageOptions = {
  prompt: string;
  alt?: string;
  signal?: AbortSignal;
};

export type GeneratedImage = {
  src: string;
  alt: string;
};

export type TextGenerationProvider = {
  name: string;
  model: string;
  streamText(messages: ProviderMessage[], options?: StreamTextOptions): Promise<AsyncIterable<string>>;
};

export type ImageGenerationProvider = {
  name: string;
  model: string;
  generateImage(options: GenerateImageOptions): Promise<GeneratedImage>;
};
