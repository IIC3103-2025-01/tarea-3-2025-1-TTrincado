export async function getEmbedding(text) {
  const apiUrl = 'https://asteroide.ing.uc.cl/api/embed';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const result = await response.json(); 
// {model: "nomic-embed-text", embeddings: Array, total_duration: 125621292, load_duration: 7981402, prompt_eval_count: 113}
    return result.embeddings
  } catch (error) {
    console.error('Error al generar embedding:', error);
    return null;
  }
}

export async function getEmbeddingsFromChunks(chunks) {
  const embeddings = [];

  for (const chunk of chunks) {
    const vector = await getEmbedding(chunk);
    if (vector) {
      embeddings.push({ text: chunk, embedding: vector[0] });
    }
  }

  return embeddings;
}