export async function askLLM(context, question) {
  const apiUrl = 'https://asteroide.ing.uc.cl/v1/chat/completions';

  const prompt = `Responde a la siguiente pregunta ayudandote con el contexto proporcionado. No es necesario que lo tomes muy literal ni que te rigas solo por el. 
    Puedes hacer inferencias simples si el contexto lo permite.
    Si no hay suficiente información en el contexto, pide que se reformule la pregunta para entenderla mejor.

    Responde siempre en español claro y conciso.

    Contexto:
    ${context}

    Pregunta: ${question}
    Respuesta:`;


  console.log("Procesando con prompt:", prompt)
  console.log("Procesando con context:", context)

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'integracion',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1,
        top_k: 5,
        num_ctx: 512,
        repeat_last_n: 10,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`LLM API Error ${response.status}: ${errorText}`);
      return `Error del servidor LLM (${response.status})`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? 'Error al generar respuesta.';
  } catch (err) {
    console.error('Error al llamar a la API del LLM:', err);
    return 'Error de red al llamar al LLM.';
  }
}