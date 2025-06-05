import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function splitTextIntoChunks(text, chunkSize = 500, chunkOverlap = 50) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const chunks = await splitter.splitText(text);
  return chunks;
}