import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ url: "http://localhost:6333" });
const COLLECTION_NAME = "wiki-embeddings";

// docker run -p 6333:6333 -p 6334:6334 \
//  -e QDRANT__SERVICE__CORS="*" \
//  qdrant/qdrant

export async function initCollection() {
  try {
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 768,
        distance: "Cosine",
      },
    });
    console.log(`Colección "${COLLECTION_NAME}" creada correctamente.`);
  } catch (err) {
    // Si el error es por colección ya existente, simplemente ignóralo
    if (err.message.includes("Conflict") || err.message.includes("already exists")) {
      console.log(`Error de conflicto: La colección "${COLLECTION_NAME}" ya existe, se usará la existente.`);
    } else {
      console.error("Error creando colección:", err);
      throw err; 
    }
  }
}

export async function deleteCollection() {
  try {
    await client.deleteCollection("wiki-embeddings");
    console.log("Colección borrada.");
  } catch (err) {
    console.log("Error borrando collección.")
    throw err;
  }
}

export async function saveEmbeddings(chunksWithEmbeddings) {
  const points = chunksWithEmbeddings.map((item, idx) => ({
    id: idx + 1,
    vector: item.embedding,
    payload: { text: item.text }
  }));

  await client.upsert(COLLECTION_NAME, { points });

  console.log("Embeddings guardados en Qdrant")
}

export async function searchSimilarChunks(queryEmbedding, topK = 5) {
  const result = await client.search(COLLECTION_NAME, {
    vector: queryEmbedding,
    top: topK
  });

  return result.map((r) => r.payload); 
}
