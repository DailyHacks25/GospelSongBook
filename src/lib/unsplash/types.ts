/**
 * Types mirroring the parts of the Unsplash API we consume.
 * https://unsplash.com/documentation
 */

export interface UnsplashUser {
  id?: string;
  username: string;
  name: string;
  links: {
    html: string;
  };
}

export interface UnsplashPhotoTag {
  title: string;
}

export interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    html: string;
    download_location?: string;
  };
  user: UnsplashUser;
  tags?: UnsplashPhotoTag[];
}

export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export type UnsplashErrorCode =
  | "missing_key"
  | "rate_limited"
  | "http_error"
  | "network_error"
  | "invalid_response";

export class UnsplashError extends Error {
  readonly code: UnsplashErrorCode;

  constructor(code: UnsplashErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "UnsplashError";
    this.code = code;
  }
}
