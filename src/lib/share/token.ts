import { customAlphabet } from "nanoid";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
const nano = customAlphabet(alphabet, 24);

export function generateToken(): string {
  return nano();
}
