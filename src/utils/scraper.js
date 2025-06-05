export async function scrapeWikipedia(url) {
    const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);

    try {
        const response = await fetch(proxyUrl);
        const data = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');

        // #bodyContent es lo que tiene lo util, el resto es links basura o cosas asi
        // asi que buscamos su div y lo focuseamos
        const contentDiv = doc.querySelector('#bodyContent'); 
        const paragraphs = contentDiv.querySelectorAll('p');

        let articleText = '';
        paragraphs.forEach(p => {
        const text = p.textContent.trim();
        if (text) {
            articleText += text + '\n';
        }
        });

        return articleText;
    } catch (error) {
        console.error('Error al scrapear Wikipedia:', error);
        return null;
    }
}
