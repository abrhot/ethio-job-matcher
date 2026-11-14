import { tokenize } from "./text";

export const EMBEDDING_DIM = 256;

function fnv(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function embedText(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIM).fill(0);
  const add = (token: string, weight: number) => {
    const hash = fnv(token);
    const index = hash % EMBEDDING_DIM;
    const sign = (hash & 1) === 0 ? 1 : -1;
    vector[index] += sign * weight;
  };

  const tokens = tokenize(text);
  for (const token of tokens) add(token, 1);
  for (let index = 0; index < tokens.length - 1; index += 1) {
    add(`${tokens[index]}_${tokens[index + 1]}`, 0.55);
  }
  for (const token of tokens) {
    if (/[\u1200-\u137F]/.test(token)) {
      for (let index = 0; index < token.length - 1; index += 1) {
        add(token.slice(index, index + 2), 0.3);
      }
    }
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

export function cosine(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) return 0;
  let dot = 0;
  for (let index = 0; index < left.length; index += 1) dot += left[index] * right[index];
  return Math.max(-1, Math.min(1, dot));
}
