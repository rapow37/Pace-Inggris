import { z } from "zod";

export const exerciseTypeSchema = z.enum([
  "multiple_choice",
  "translate_build",
  "type_answer",
  "listening",
  "match_pairs",
]);
export type ExerciseType = z.infer<typeof exerciseTypeSchema>;

const base = { id: z.string().min(1), explanation: z.string().optional() };

export const multipleChoiceSchema = z.object({
  ...base,
  type: z.literal("multiple_choice"),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(3).max(4),
  correctIndex: z.number().int().min(0),
});

export const translateBuildSchema = z.object({
  ...base,
  type: z.literal("translate_build"),
  prompt: z.string().min(1),
  answerTokens: z.array(z.string().min(1)).min(1),
  distractors: z.array(z.string().min(1)).default([]),
  acceptedVariants: z.array(z.array(z.string().min(1))).default([]),
  audioUrl: z.string().optional(),
});

export const typeAnswerSchema = z.object({
  ...base,
  type: z.literal("type_answer"),
  prompt: z.string().min(1),
  answer: z.string().min(1),
  acceptedVariants: z.array(z.string().min(1)).default([]),
  audioUrl: z.string().optional(),
});

export const listeningSchema = z.object({
  ...base,
  type: z.literal("listening"),
  prompt: z.string().optional(),
  audioUrl: z.string().min(1),
  answer: z.string().min(1),
  acceptedVariants: z.array(z.string().min(1)).default([]),
});

export const matchPairsSchema = z.object({
  ...base,
  type: z.literal("match_pairs"),
  pairs: z
    .array(z.object({ left: z.string().min(1), right: z.string().min(1) }))
    .min(2)
    .max(5),
});

export const exerciseSchema = z.discriminatedUnion("type", [
  multipleChoiceSchema,
  translateBuildSchema,
  typeAnswerSchema,
  listeningSchema,
  matchPairsSchema,
]);
export type Exercise = z.infer<typeof exerciseSchema>;

export const lessonContentSchema = z.object({
  title: z.string().min(1),
  exercises: z.array(exerciseSchema).min(1),
});
export type LessonContent = z.infer<typeof lessonContentSchema>;

export const answerInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("index"), index: z.number().int().min(0) }),
  z.object({ kind: z.literal("tokens"), tokens: z.array(z.string()) }),
  z.object({ kind: z.literal("text"), text: z.string() }),
  z.object({
    kind: z.literal("pairs"),
    pairs: z.array(z.object({ left: z.string(), right: z.string() })),
  }),
]);
export type AnswerInput = z.infer<typeof answerInputSchema>;
