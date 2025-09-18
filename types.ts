
export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface VerificationResult {
  verdict: string;
  analysis: string;
  sources: GroundingChunk[];
}

export interface ImageFile {
    file: File;
    dataUrl: string;
    mimeType: string;
}

export interface Badge {
  name: string;
  threshold: number;
  color: string;
  bgColor: string;
}
