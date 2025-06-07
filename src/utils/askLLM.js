export async function askLLM(context, question) {
  const apiUrl = 'https://asteroide.ing.uc.cl/v1/chat/completions';

    const prompt = `Tu ROL es de responder preguntas basandote en tus conocimientos y ayudandote con el contexto que se te proporciona.

    Estas preguntas provienen de un usuario que esta interactuando con un ChatBOT (Tu).

    Responde en español claro y conciso la siguiente pregunta. 

    Debes usar el texto base que está en ingles (tu mismo debes traducirlo y comprenderlo) como ayuda para tu respuesta. 

    Haz inferencias simples si el contenido lo permite.

    Si no hay suficiente información, o el texto base está vacío, pide una reformulación o menciona que no tienes datos suficientes.

    IMPORTANTE: [Este proceso debe ser transparente para el usuario que realiza las consultas.
    NO PUEDES mencionar nada fuera de la respuesta que vayas a generar.
    Debes priorizar responder lo que sea que pregunte el usuario, que estará bajo Pregunta del usuario
    NO PARTAS RESPONDIENDO LA PREGUNTA CON la respuesta es: o la respuesta es la siguiente:. Solo responde al usuario derechamente.]

    Texto base:
    ${context}

    Pregunta del usuario:
    ${question}`;


  console.log("Procesando con prompt:", prompt)

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