import { z } from 'zod';

// Content item schema
export type ContentItem = {
  type: "text";
  text: string;
  [key: string]: unknown;
} | {
  type: "image";
  data: string;
  mimeType: string;
  [key: string]: unknown;
} | {
  type: "resource";
  resource: {
    text: string;
    uri: string;
    mimeType?: string;
    [key: string]: unknown;
  } | {
    uri: string;
    blob: string;
    mimeType?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

// Tool response type
export type ToolResponse = {
  content: ContentItem[];
  tools?: {
    name: string;
    description: string;
  }[];
  resources?: {
    uri: string;
    description: string;
  }[];
  _meta?: Record<string, unknown>;
  isError?: boolean;
  [key: string]: unknown;
};

// Tool handler type
export type ToolHandler = (extra: { params?: Record<string, unknown> }) => Promise<ToolResponse>;

// Tool type
export interface Tool {
  name: string;
  description: string;
  schema?: z.ZodType;
  handler: ToolHandler;
}
