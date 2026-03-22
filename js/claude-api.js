var ClaudeAPI = {

  API_KEY: CONFIG.GEMINI_KEY,
  MODEL: 'gemini-2.5-flash',

  getURL() {
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.MODEL}:generateContent?key=${this.API_KEY}`;
  },

  async askClaude(question) {
    try {
      const response = await fetch(this.getURL(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: `You are FarmVoice AI, a helpful farming assistant for blind and
                     visually impaired farmers in South Africa.
                     Keep all answers short, clear and spoken-friendly.
                     Maximum 3 sentences. No bullet points. No markdown.
                     Speak like you are talking to a farmer directly.`
            }]
          },
          contents: [{
            parts: [{ text: question }]
          }]
        })
      });

      const data = await response.json();
      console.log('Gemini response:', data);

      if (data.error) {
        console.error('Gemini error:', data.error.message);
        return 'Sorry, I could not get an answer right now.';
      }

      const text = data.candidates[0].content.parts[0].text;
      return text.replace(/[*#_`]/g, '').trim();

    } catch (error) {
      console.error('Gemini API error:', error);
      return 'Sorry, I am having trouble connecting. Please try again.';
    }
  },

  async analyzeImage(base64Image) {
    try {
      const response = await fetch(this.getURL(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image
                }
              },
              {
                text: `Look at this livestock animal.
                       Tell me the breed and colour in one short sentence.
                       Example: "This appears to be a brown Bonsmara cow."
                       If you cannot identify the breed say:
                       "This appears to be a mixed breed animal."`
              }
            ]
          }]
        })
      });

      const data = await response.json();
      console.log('Vision response:', data);

      if (data.error) {
        console.error('Vision error:', data.error.message);
        return 'Could not identify the animal.';
      }

      return data.candidates[0].content.parts[0].text;

    } catch (error) {
      console.error('Vision API error:', error);
      return 'Could not analyze the image. Please try again.';
    }
  }

};