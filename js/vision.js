var Vision = {

  async handlePhoto(input) {
    if (!input || !input.files || !input.files[0]) {
      await VoiceEngine.speak('No photo selected. Please try again.');
      return;
    }
    const file = input.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      await VoiceEngine.speak('Please select an image file.');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      await VoiceEngine.speak('Image is too large. Please use a smaller photo.');
      return;
    }

    await VoiceEngine.speak('Photo received. Analyzing the animal. Please wait.');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;

      // Show image preview
      document.getElementById('photo-preview').innerHTML =
        `<img src="${base64}" alt="Animal photo" style="width:100%;height:100%;object-fit:cover;border-radius:14px">`;

      // Strip prefix
      const base64Data = base64.split(',')[1];

      // Send to Gemini Vision
      const result = await ClaudeAPI.analyzeImage(base64Data);
      console.log('Breed result:', result);

      // Show result
      const breedDiv = document.getElementById('breed-result');
      breedDiv.style.display = 'block';
      breedDiv.textContent = result;

      // Speak result
      await VoiceEngine.speak(result);

      // Save to animal
      if (Animal.currentAnimal) {
        const words = result.toLowerCase();
        let colour = '';
        const colours = ['brown', 'black', 'white', 'red', 'grey',
                         'gray', 'spotted', 'tan', 'cream', 'yellow'];
        colours.forEach(c => { if (words.includes(c)) colour = c; });

        FarmStorage.updateAnimal(
          Animal.currentAnimal.category || App.currentCategory,
          Animal.currentAnimal.id,
          {
            photo: base64,
            breed: result,
            colour: colour
          }
        );

        await VoiceEngine.speak(
          `Breed saved. Would you like to view ${Animal.currentAnimal.name}'s profile? Say yes or no.`
        );

        try {
          const response = await VoiceEngine.listen();
          if (response.includes('yes')) {
            Animal.viewProfile(
              Animal.currentAnimal.category || App.currentCategory,
              Animal.currentAnimal.id
            );
          } else {
            App.goTo('home');
            Home.load();
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    reader.onerror = () => {
      console.error('Error reading file:', reader.error);
      VoiceEngine.speak('Error reading image file. Please try again.');
    };

    reader.readAsDataURL(file);
  }

};