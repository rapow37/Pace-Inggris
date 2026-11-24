import { en } from "./en";
import { id } from "./id";

export const messages = { id, en };

export type MessageKey = keyof typeof id;
