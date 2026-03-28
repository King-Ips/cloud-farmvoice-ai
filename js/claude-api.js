var ClaudeAPI = {

  async askClaude(question) {
    // Input validation
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return 'Please ask a question.';
    }
    
    const sanitized = this._sanitizeInput(question);
    
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: sanitized })
      });

      if (!response.ok) {
        console.error('API Error:', response.status);
        return 'Sorry, I am having trouble connecting. Please try again.';
      }

      const data = await response.json();
      if (data.error) {
        console.error('API returned error:', data.error);
        return 'Sorry, I could not get an answer right now.';
      }
      
      return data.response || 'No response received.';

    } catch (error) {
      console.error('API request error:', error);
      return 'Sorry, I am having trouble connecting. Please try again.';
    }
  },

  async analyzeImage(base64Image) {
    // Input validation
    if (!base64Image || typeof base64Image !== 'string' || base64Image.trim().length === 0) {
      return 'Could not analyze the image. Invalid image data.';
    }

    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      if (!response.ok) {
        console.error('API Error:', response.status);
        return 'Could not analyze the image. Please try again.';
      }

      const data = await response.json();
      if (data.error) {
        console.error('API returned error:', data.error);
        return 'Could not identify the animal.';
      }
      
      return data.response || 'Could not identify the animal.';

    } catch (error) {
      console.error('Image analysis error:', error);
      return 'Could not analyze the image. Please try again.';
    }
  },

  _sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    // Remove HTML tags and limit length
    return input
      .replace(/<[^>]*>/g, '')
      .slice(0, 500)
      .trim();
  }
};