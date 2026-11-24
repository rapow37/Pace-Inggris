import { PrismaClient } from "@prisma/client";

import { exerciseSchema, type Exercise } from "../src/domains/lesson/schema";

const prisma = new PrismaClient();

type Word = { en: string; id: string };
type UnitDef = {
  slug: string;
  title: string;
  icon: string;
  words: Word[];
  sentences: [string, string[]][];
};

const units: UnitDef[] = [
  {
    slug: "pasar",
    title: "Di Pasar",
    icon: "🛒",
    words: [
      { en: "market", id: "pasar" },
      { en: "fish", id: "ikan" },
      { en: "rice", id: "beras" },
      { en: "vegetable", id: "sayur" },
      { en: "price", id: "harga" },
      { en: "money", id: "uang" },
    ],
    sentences: [
      ["Saya beli ikan", ["I", "buy", "fish"]],
      ["Harga beras murah", ["rice", "is", "cheap"]],
    ],
  },
  {
    slug: "laut",
    title: "Di Laut",
    icon: "🌊",
    words: [
      { en: "sea", id: "laut" },
      { en: "boat", id: "perahu" },
      { en: "net", id: "jaring" },
      { en: "island", id: "pulau" },
      { en: "wave", id: "ombak" },
      { en: "sailor", id: "nelayan" },
    ],
    sentences: [
      ["Perahu ada di laut", ["The", "boat", "is", "at", "sea"]],
      ["Nelayan membawa jaring", ["The", "sailor", "brings", "a", "net"]],
    ],
  },
  {
    slug: "kebun",
    title: "Di Kebun",
    icon: "🌱",
    words: [
      { en: "garden", id: "kebun" },
      { en: "tree", id: "pohon" },
      { en: "flower", id: "bunga" },
      { en: "fruit", id: "buah" },
      { en: "water", id: "air" },
      { en: "soil", id: "tanah" },
    ],
    sentences: [
      ["Bunga itu merah", ["The", "flower", "is", "red"]],
      ["Saya siram pohon", ["I", "water", "the", "tree"]],
    ],
  },
];

function pick(words: Word[], i: number): Word {
  return words[i % words.length]!;
}

function buildExercises(unit: UnitDef, lesson: number): Exercise[] {
  const w = unit.words;
  const offset = (lesson - 1) * 3;
  const correct = pick(w, offset);
  const wrongA = pick(w, offset + 1);
  const wrongB = pick(w, offset + 2);
  const [sentenceId, sentenceTokens] = unit.sentences[lesson - 1]!;

  const options = [correct.id, wrongA.id, wrongB.id];
  const rotated = [...options.slice(1), options[0]!];
  const correctIndex = rotated.indexOf(correct.id);

  const raw: Exercise[] = [
    {
      id: `${unit.slug}-l${lesson}-e1`,
      type: "multiple_choice",
      prompt: `Pilih arti "${correct.en}"`,
      options: rotated,
      correctIndex,
      explanation: `${correct.en} = ${correct.id}`,
    },
    {
      id: `${unit.slug}-l${lesson}-e2`,
      type: "type_answer",
      prompt: `Tulis dalam bahasa Inggris: "${wrongA.id}"`,
      answer: wrongA.en,
      acceptedVariants: [],
      explanation: `${wrongA.id} = ${wrongA.en}`,
    },
    {
      id: `${unit.slug}-l${lesson}-e3`,
      type: "translate_build",
      prompt: `Susun ke bahasa Inggris: "${sentenceId}"`,
      answerTokens: sentenceTokens,
      distractors: ["the", "a", "very"],
      acceptedVariants: [],
      explanation: `Terjemahan: "${sentenceTokens.join(" ")}"`,
    },
    {
      id: `${unit.slug}-l${lesson}-e4`,
      type: "match_pairs",
      pairs: [
        { left: correct.id, right: correct.en },
        { left: wrongA.id, right: wrongA.en },
        { left: wrongB.id, right: wrongB.en },
      ],
    },
    {
      id: `${unit.slug}-l${lesson}-e5`,
      type: "listening",
      audioUrl: `/audio/${wrongB.en.replace(/ /g, "-")}.mp3`,
      answer: wrongB.en,
      acceptedVariants: [],
      explanation: `${wrongB.id} = ${wrongB.en}`,
    },
    {
      id: `${unit.slug}-l${lesson}-e6`,
      type: "multiple_choice",
      prompt: `Pilih arti "${wrongA.en}"`,
      options: [wrongA.id, correct.id, wrongB.id],
      correctIndex: 0,
      explanation: `${wrongA.en} = ${wrongA.id}`,
    },
    {
      id: `${unit.slug}-l${lesson}-e7`,
      type: "type_answer",
      prompt: `Tulis dalam bahasa Inggris: "${wrongB.id}"`,
      answer: wrongB.en,
      acceptedVariants: [],
    },
    {
      id: `${unit.slug}-l${lesson}-e8`,
      type: "translate_build",
      prompt: `Susun ke bahasa Inggris: "${sentenceId}"`,
      answerTokens: sentenceTokens,
      distractors: ["is", "the", "and"],
      acceptedVariants: [],
    },
  ];

  return raw.map((ex) => exerciseSchema.parse(ex));
}

async function seed() {
  const slug = "english-id";
  await prisma.course.deleteMany({ where: { slug } });

  const course = await prisma.course.create({
    data: { slug, title: "Bahasa Inggris Sehari-hari", sourceLang: "en", targetLang: "id" },
  });

  let unitOrder = 1;
  for (const unit of units) {
    const createdUnit = await prisma.unit.create({
      data: { courseId: course.id, order: unitOrder, title: unit.title },
    });

    const skill = await prisma.skill.create({
      data: { unitId: createdUnit.id, order: 1, title: unit.title, icon: unit.icon },
    });

    for (let lesson = 1; lesson <= 2; lesson += 1) {
      const lessonRow = await prisma.lesson.create({
        data: {
          skillId: skill.id,
          order: lesson,
          version: 1,
          estMinutes: 4,
          contentJson: { title: `${unit.title} — Bagian ${lesson}` },
        },
      });

      let order = 1;
      for (const exercise of buildExercises(unit, lesson)) {
        await prisma.exercise.create({
          data: {
            lessonId: lessonRow.id,
            order: order++,
            type: exercise.type,
            difficulty: 1,
            payloadJson: exercise,
          },
        });
      }
    }

    unitOrder += 1;
  }

  console.log(`Seeded course "${slug}" with ${units.length} units.`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
