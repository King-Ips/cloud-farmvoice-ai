var Vision = {

  cameraStream: null,
  model: null,
  detectLoop: null,
  isDetecting: false,
  targetAnimals: ['bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe'], // COCO classes that resemble livestock

  // Keep manual fallback just in case
  async handlePhoto(input) {
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      await this.processImageBase64(e.target.result);
    };
    reader.readAsDataURL(file);
  },

  async initModel() {
    if (!this.model) {
      this.model = await window.cocoSsd.load();
    }
  },

  async openLiveCamera() {
    App.goTo('camera');
    const label = document.getElementById('camera-label');
    const btn = document.getElementById('capture-btn');
    const overlay = document.getElementById('camera-overlay');
    
    label.textContent = "Loading AI model...";
    btn.disabled = true;
    overlay.style.borderColor = 'transparent';
    btn.style.background = '#ccc';

    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      const video = document.getElementById('camera-video');
      video.srcObject = this.cameraStream;
      
      // Load model if not loaded
      await this.initModel();
      label.textContent = "Point camera at the animal...";

      this.isDetecting = true;
      this.startDetectionLoop(video);

    } catch (e) {
      console.error('Camera error:', e);
      label.textContent = "Camera access denied.";
      VoiceEngine.speak("I cannot access the camera. Please check your permissions.");
      setTimeout(() => this.closeCamera(), 3000);
    }
  },

  closeCamera() {
    this.isDetecting = false;
    if (this.detectLoop) {
      clearTimeout(this.detectLoop);
      this.detectLoop = null;
    }
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(t => t.stop());
      this.cameraStream = null;
    }
    App.goBack();
  },

  async startDetectionLoop(video) {
    if (!this.isDetecting) return;
    
    if (video.readyState === 4) {
      try {
        const predictions = await this.model.detect(video);
        const animalFound = predictions.find(p => this.targetAnimals.includes(p.class));
        
        const overlay = document.getElementById('camera-overlay');
        const btn = document.getElementById('capture-btn');
        const label = document.getElementById('camera-label');

        if (animalFound) {
          if (overlay.style.borderColor !== 'green') {
            overlay.style.borderColor = 'green';
            btn.style.background = '#4CAF50';
            btn.disabled = false;
            let aClass = animalFound.class === 'bird' ? 'chicken' : animalFound.class;
            label.textContent = `Animal detected (${aClass})! Tap capture.`;
            this.playBeepSound();
            VoiceEngine.speak("Animal detected. Tap the button to capture.");
          }
        } else {
          overlay.style.borderColor = 'transparent';
          btn.style.background = '#ccc';
          btn.disabled = true;
          label.textContent = "Looking for animal...";
        }
      } catch (err) {
        console.warn("Detection err:", err);
      }
    }

    this.detectLoop = setTimeout(() => {
      requestAnimationFrame(() => this.startDetectionLoop(video));
    }, 500); // 2 FPS detection is plenty
  },

  playBeepSound() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch(e) {}
  },

  async captureFrame() {
    this.isDetecting = false;
    const video = document.getElementById('camera-video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    
    // Close camera view
    this.closeCamera();

    await this.processImageBase64(base64);
  },

  async processImageBase64(base64) {
    document.getElementById('photo-preview').innerHTML =
      `<img src="${base64}" alt="Animal photo" style="width:100%;height:100%;object-fit:cover;border-radius:14px">`;

    await VoiceEngine.speak('Photo captured. Analyzing the animal. Please wait.');

    const base64Data = base64.split(',')[1];
    
    let result = '';
    try {
      result = await ClaudeAPI.analyzeImage(base64Data);
    } catch(e) {
      console.error(e);
      await VoiceEngine.speak("Failed to connect to the vision AI.");
      return;
    }

    console.log('Breed result:', result);

    const breedDiv = document.getElementById('breed-result');
    breedDiv.style.display = 'block';
    breedDiv.textContent = result;

    await VoiceEngine.speak(result);

    if (Animal.currentAnimal) {
      const words = result.toLowerCase();
      let colour = '';
      const colours = ['brown', 'black', 'white', 'red', 'grey', 'gray', 'spotted', 'tan', 'cream', 'yellow'];
      colours.forEach(c => { if (words.includes(c)) colour = c; });

      FarmStorage.updateAnimal(
        Animal.currentAnimal.category || App.currentCategory,
        Animal.currentAnimal.id,
        { photo: base64, breed: result, colour: colour }
      );

      await VoiceEngine.speak(`Breed saved. Would you like to view ${Animal.currentAnimal.name}'s profile? Say yes or no.`);

      try {
        const response = await VoiceEngine.listen();
        if (response.includes('yes')) {
          Animal.viewProfile(Animal.currentAnimal.category || App.currentCategory, Animal.currentAnimal.id);
        } else {
          App.goTo('home');
        }
      } catch (e) {
        if (e !== 'handled_global') App.goTo('home');
      }
    }
  }

};