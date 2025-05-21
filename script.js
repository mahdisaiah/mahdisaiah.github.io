document.addEventListener("DOMContentLoaded", () => {
  // Three.js Particle System for Hero Section
  function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Create particle system with custom shader
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 3000;
    const posArray = new Float32Array(particlesCount * 3);
    const sizes = new Float32Array(particlesCount);
    for (let i = 0; i < particlesCount; i++) {
      posArray[i * 3] = (Math.random() - 0.5) * 800;
      posArray[i * 3 + 1] = (Math.random() - 0.5) * 800;
      posArray[i * 3 + 2] = (Math.random() - 0.5) * 800;
      sizes[i] = Math.random() * 5 + 2;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const vertexShader = `
      attribute float size;
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_PointSize = size;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const fragmentShader = `
      varying vec3 vPosition;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        gl_FragColor = vec4(0.2, 0.2, 0.2, 0.8 - dist * 0.5); // #333333
      }
    `;
    const particlesMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    camera.position.z = 400;

    // Mouse interaction
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Animation
    function animate() {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.0001;
      particlesMesh.rotation.y += 0.001;
      particlesMesh.rotation.x += 0.0005;
      camera.position.x += Math.sin(time) * 10;
      camera.position.y += Math.cos(time) * 10;
      camera.position.x += (mouseX * 100 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 100 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    }
    animate();

    // Resize handling
    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });
  }

  // Text Animation
  function initTextAnimation() {
    gsap.from(".hero-title", {
      opacity: 0,
      y: 50,
      duration: 1.5,
      ease: "power3.out",
    });
    gsap.from(".hero-subtitle", {
      opacity: 0,
      y: 50,
      duration: 1.5,
      delay: 0.3,
      ease: "power3.out",
    });

    const heroContent = document.querySelector('.hero-content');
    heroContent.addEventListener('mousemove', (e) => {
      const rect = heroContent.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(".hero-title", {
        x: x * 0.1,
        y: y * 0.1,
        rotationX: y * 0.02,
        rotationY: -x * 0.02,
        duration: 0.5,
      });
      gsap.to(".hero-subtitle", {
        x: x * 0.05,
        y: y * 0.05,
        rotationX: y * 0.01,
        rotationY: -x * 0.01,
        duration: 0.5,
      });
    });

    heroContent.addEventListener('mouseleave', () => {
      gsap.to(".hero-title, .hero-subtitle", {
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        duration: 0.5,
      });
    });
  }

  // Model Controller for <model-viewer>
  const ModelController = (() => {
    // Reference to the model-viewer element
    const viewer = document.getElementById('modelViewer');

    // Check if viewer exists to prevent errors
    if (!viewer) {
      console.error('Model Viewer element with ID "modelViewer" not found.');
      return {
        toggleRotate: () => console.warn('Model Viewer not initialized.'),
        toggleAR: () => console.warn('Model Viewer not initialized.'),
        resetView: () => console.warn('Model Viewer not initialized.'),
        setExposure: () => console.warn('Model Viewer not initialized.'),
        setZoom: () => console.warn('Model Viewer not initialized.'),
        setShadowIntensity: () => console.warn('Model Viewer not initialized.'),
        setOrbit: () => console.warn('Model Viewer not initialized.')
      };
    }

    // State management with extended properties
    const state = {
      isRotating: true,
      exposure: 1.0,
      shadowIntensity: 1.0,
      environmentIntensity: 1.0,
      fieldOfView: 45, // in degrees
      orbit: { theta: 0, phi: 75, radius: 'auto' }, // Camera orbit angles
      animationFrameId: null
    };

    // Update state with validation
    const updateState = (newState) => {
      Object.assign(state, newState);
      applyState();
    };

    // Apply state changes to the viewer with smooth transitions
    const applyState = () => {
      viewer.autoRotate = state.isRotating;
      viewer.exposure = state.exposure;
      viewer.shadowIntensity = state.shadowIntensity;
      viewer.environmentImageIntensity = state.environmentIntensity;
      viewer.fieldOfView = `${state.fieldOfView}deg`;
      viewer.cameraOrbit = `${state.orbit.theta}deg ${state.orbit.phi}deg ${state.orbit.radius}`;
    };

    // Smooth interpolation for exposure and shadow intensity
    const smoothUpdate = (targetKey, targetValue, duration = 500) => {
      const startValue = state[targetKey];
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
        const newValue = startValue + (targetValue - startValue) * easedProgress;

        updateState({ [targetKey]: newValue });

        if (progress < 1) {
          state.animationFrameId = requestAnimationFrame(animate);
        } else {
          cancelAnimationFrame(state.animationFrameId);
        }
      };

      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = requestAnimationFrame(animate);
    };

    // Initialize viewer with default settings
    const initViewer = () => {
      viewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
      viewer.setAttribute('environment-image', 'neutral'); // Neutral HDR environment
      viewer.setAttribute('shadow-intensity', state.shadowIntensity);
      viewer.setAttribute('exposure', state.exposure);
      viewer.setAttribute('auto-rotate-delay', '0');
      applyState();

      // Log initialization
      console.log('Model Viewer initialized with default settings.');
    };

    // Initialize immediately if viewer exists
    initViewer();

    return {
      // Toggle auto-rotation with smooth start/stop
      toggleRotate: () => {
        updateState({ isRotating: !state.isRotating });
        console.log(`Auto-rotation ${state.isRotating ? 'enabled' : 'disabled'}.`);
      },

      // Toggle AR mode with device compatibility check
      toggleAR: () => {
        if (viewer.canActivateAR) {
          viewer.activateAR();
          console.log('AR mode activated.');
        } else {
          alert('AR is not supported on this device or browser. Please try on a compatible device (e.g., Android with WebXR or iOS with Quick Look).');
          console.warn('AR mode not supported.');
        }
      },

      // Reset view to default with smooth transition
      resetView: () => {
        smoothUpdate('fieldOfView', 45, 500);
        updateState({
          orbit: { theta: 0, phi: 75, radius: 'auto' },
          cameraTarget: 'auto auto auto'
        });
        console.log('View reset to default.');
      },

      // Set exposure with smooth transition (0.1 to 2.0 range)
      setExposure: (value) => {
        const exposureValue = Math.max(0.1, Math.min(2.0, parseFloat(value)));
        smoothUpdate('exposure', exposureValue);
        console.log(`Exposure set to: ${exposureValue}`);
      },

      // Set zoom level via field of view (10 to 90 degrees)
      setZoom: (value) => {
        const fovValue = Math.max(10, Math.min(90, parseFloat(value)));
        smoothUpdate('fieldOfView', fovValue);
        console.log(`Field of view set to: ${fovValue}deg`);
      },

      // Set shadow intensity (0 to 1 range)
      setShadowIntensity: (value) => {
        const shadowValue = Math.max(0, Math.min(1, parseFloat(value)));
        smoothUpdate('shadowIntensity', shadowValue);
        console.log(`Shadow intensity set to: ${shadowValue}`);
      },

      // Set environment map intensity (0 to 2 range)
      setEnvironmentIntensity: (value) => {
        const envValue = Math.max(0, Math.min(2, parseFloat(value)));
        smoothUpdate('environmentIntensity', envValue);
        console.log(`Environment intensity set to: ${envValue}`);
      },

      // Set camera orbit angles (theta: azimuth, phi: elevation)
      setOrbit: (theta, phi, radius = 'auto') => {
        updateState({
          orbit: { theta: parseFloat(theta), phi: parseFloat(phi), radius }
        });
        console.log(`Camera orbit set to: ${theta}deg, ${phi}deg, ${radius}`);
      },

      // Get current state for debugging or UI sync
      getState: () => ({ ...state })
    };
  })();

  // Hamburger Menu Toggle
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.querySelector('i').classList.toggle('fa-bars');
    hamburger.querySelector('i').classList.toggle('fa-times');
  });

  // Portfolio Carousel Logic
  const carousel = document.querySelector(".carousel");
  const carouselImages = document.querySelector(".carousel-images");
  const carouselItems = document.querySelectorAll(".carousel-item");
  const arrowLeft = document.querySelector(".arrow-left");
  const arrowRight = document.querySelector(".arrow-right");

  let currentIndex = 0;
  let autoPlayInterval;

  function showSlide(index) {
    const offset = -index * 100;
    carouselImages.style.transform = `translateX(${offset}%)`;
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % carouselItems.length;
    showSlide(currentIndex);
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + carouselItems.length) % carouselItems.length;
    showSlide(currentIndex);
  }

  function startAutoPlay() {
    autoPlayInterval = setInterval(nextSlide, 10000);
  }

  function stopAutoPlay() {
    clearInterval(autoPlayInterval);
  }

  arrowLeft.addEventListener("click", () => {
    prevSlide();
    stopAutoPlay();
    startAutoPlay();
  });

  arrowRight.addEventListener("click", () => {
    nextSlide();
    stopAutoPlay();
    startAutoPlay();
  });

  carousel.addEventListener("mouseenter", stopAutoPlay);
  carousel.addEventListener("mouseleave", startAutoPlay);

  showSlide(currentIndex);
  startAutoPlay();

  // Video Carousel Logic
  const videoCarousel = document.querySelector(".video-carousel");
  const videoCarouselImages = document.querySelector(".video-carousel-images");
  const videoCarouselItems = document.querySelectorAll(".video-carousel-item");
  const videoArrowLeft = document.querySelector(".video-arrow-left");
  const videoArrowRight = document.querySelector(".video-arrow-right");

  let videoCurrentIndex = 0;
  let videoAutoPlayInterval;

  function showVideoSlide(index) {
    const offset = -index * 100;
    videoCarouselImages.style.transform = `translateX(${offset}%)`;
  }

  function nextVideoSlide() {
    videoCurrentIndex = (videoCurrentIndex + 1) % videoCarouselItems.length;
    showVideoSlide(videoCurrentIndex);
  }

  function prevVideoSlide() {
    videoCurrentIndex = (videoCurrentIndex - 1 + carouselItems.length) % videoCarouselItems.length;
    showVideoSlide(videoCurrentIndex);
  }

  function startVideoAutoPlay() {
    videoAutoPlayInterval = setInterval(nextVideoSlide, 15000);
  }

  function stopVideoAutoPlay() {
    clearInterval(videoAutoPlayInterval);
  }

  videoArrowLeft.addEventListener("click", () => {
    prevVideoSlide();
    stopVideoAutoPlay();
    startVideoAutoPlay();
  });

  videoArrowRight.addEventListener("click", () => {
    nextVideoSlide();
    stopVideoAutoPlay();
    startVideoAutoPlay();
  });

  videoCarousel.addEventListener("mouseenter", stopVideoAutoPlay);
  videoCarousel.addEventListener("mouseleave", startVideoAutoPlay);

  showVideoSlide(videoCurrentIndex);
  startVideoAutoPlay();

  // Contact Form Submission Handling
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(contactForm);
      fetch(contactForm.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      })
        .then((response) => {
          if (response.ok) {
            alert("Thank you for your message! I'll get back to you soon.");
            contactForm.reset();
          } else {
            alert("Oops! Something went wrong. Please try again.");
          }
        })
        .catch((error) => {
          alert("Oops! Something went wrong. Please try again.");
        });
    });
  }

  // Chatbot Logic
  const chatbotToggle = document.querySelector('.chatbot-toggle');
  const chatbotWindow = document.querySelector('.chatbot-window');
  const chatbotClose = document.querySelector('.chatbot-close');
  const chatbotInput = document.getElementById('chatbot-input');
  const chatbotSend = document.getElementById('chatbot-send');
  const chatbotMessages = document.getElementById('chatbot-messages');

  // Extensive Q&A data with 100+ conversational triggers
  const qaData = [
    {
      question: 'What are your skills?',
      keywords: ['skills', 'what can you do', 'abilities', 'compétences', 'expertise', 'talents', 'what you good at', 'skillset'],
      response: 'Mahdi is a 3D Generalist and Game Designer proficient in Blender, Unity, Unreal Engine, and Substance Painter for creating immersive digital environments. He has expertise in programming character controllers and AI-powered NPCs using C++, Python, and C#. Additionally, he’s skilled in algorithm design, object-oriented programming, machine learning, data analysis, web development, cloud development, and distributed systems.'
    },
    {
      question: 'Where do I find your work?',
      keywords: ['portfolio', 'projects', 'work', 'travaux', 'showcase', 'creations', 'where’s your stuff', 'gallery'],
      response: 'You can explore Mahdi’s portfolio in the Portfolio section, which features a diverse collection of 3D models, game prototypes, AI-driven NPC systems, real-time dynamic environments, and data analysis projects.'
    },
    {
      question: 'Who is Mahdi?',
      keywords: ['about', 'who is mahdi', 'background', 'à propos', 'bio', 'mahdi', 'who’s this guy', 'tell me about mahdi'],
      response: 'Mahdi Saiah is a 22-year-old 3D Generalist and Game Designer expanding into software development, data science, and artificial intelligence. With a background in creating immersive digital environments using Blender, Unity, Unreal Engine, and Substance Painter, he blends creative vision with technical expertise. He’s currently deepening his skills in algorithm design, machine learning, and distributed systems, seeking work-study opportunities in tech.'
    },
    {
      question: 'How can I contact Mahdi?',
      keywords: ['contact', 'reach', 'hire', 'contacter', 'get in touch', 'message', 'hit you up', 'connect'],
      response: 'You can reach Mahdi through the Contact section of this website or connect with him on LinkedIn. He is available for work-study opportunities (alternance) in application development, data engineering, data science, IT systems management, or research engineering.'
    },
    {
      question: 'What game development experience do you have?',
      keywords: ['game development', 'games', 'unity', 'unreal', 'développement de jeux', 'game dev', 'gaming', 'game design'],
      response: 'Mahdi has extensive experience in game development using Unity and Unreal Engine, programming in C# and C++. He has developed fully coded character controllers, AI-powered NPCs, and real-time dynamic environments for PC, VR platforms like Meta Quest, and mobile devices, focusing on engaging gameplay and immersive experiences.'
    },
    {
      question: 'Tell me about your 3D modeling work',
      keywords: ['3d modeling', 'animation', 'blender', 'maya', 'modélisation 3d', '3d work', 'modeling', '3d art'],
      response: 'Mahdi creates high-quality 3D models and animations using Blender, Unity, Unreal Engine, and Substance Painter. His work includes detailed characters, immersive environments, and real-time dynamic scenes for VR and game projects, blending artistry with technical precision.'
    },
    {
      question: 'Hello',
      keywords: ['hello', 'hi', 'hey', 'bonjour', 'salut', 'yo', 'whatup', 'hola', 'sup'],
      response: 'Greetings! I’m Mahdi’s AI Assistant, here to provide information about his skills in 3D design, game development, software development, and data science. How can I assist you today?'
    },
    {
      question: 'How are you?',
      keywords: ['how are you', 'how you doing', 'ça va', 'comment vas-tu', 'how’s it hangin', 'you good', 'how you holdin up', 'how’s life'],
      response: 'I’m doing great, thank you! I’m here to answer questions about Mahdi’s expertise in 3D, AI, and software development. What would you like to know?'
    },
    {
      question: 'What’s up?',
      keywords: ['what’s up', 'what’s good', 'what’s new', 'quoi de neuf', 'sup', 'what’s poppin', 'what’s the word', 'what’s cooking'],
      response: 'I’m here to share details about Mahdi’s projects in game design, software development, and data science. What’s on your mind—interested in his portfolio or career goals?'
    },
    {
      question: 'Tell me about yourself',
      keywords: ['about yourself', 'who are you', 'what are you', 'qui es-tu', 'tell me bout you', 'who’s this', 'your deal'],
      response: 'I’m Mahdi’s AI Assistant, designed to provide insights into his work as a 3D Generalist, Game Designer, and aspiring software developer and data scientist. Ask me about his skills, projects, or work-study opportunities!'
    },
    {
      question: 'Thanks',
      keywords: ['thanks', 'thank you', 'merci', 'gracias', 'appreciate it', 'cheers', 'ty', 'thx'],
      response: 'You’re very welcome! Feel free to ask more about Mahdi’s work in AI, 3D design, or software development.'
    },
    {
      question: 'You’re cool',
      keywords: ['you’re cool', 'you’re awesome', 'you rock', 't’es cool', 'you’re dope', 'nice one', 'you’re fire', 'you’re lit'],
      response: 'Thanks for the vibe! I’m here to highlight Mahdi’s innovative projects in VR, AI, and data science. Want to explore his portfolio?'
    },
    {
      question: 'Goodbye',
      keywords: ['bye', 'goodbye', 'see you', 'au revoir', 'later', 'peace out', 'catch ya', 'adios'],
      response: 'Thanks for visiting! Check out Mahdi’s portfolio for a showcase of his work in 3D, game design, and tech.'
    },
    {
      question: 'What do you like to do?',
      keywords: ['what do you like', 'hobbies', 'what you enjoy', 'que fais-tu', 'your thing', 'what’s your deal', 'what you into'],
      response: 'My role is to support Mahdi by sharing his work in 3D design, game development, and emerging tech fields like AI and data science. What are your interests?'
    },
    {
      question: 'What’s your favorite game?',
      keywords: ['favorite game', 'best game', 'jeu préféré', 'what game you like', 'top game', 'game you love', 'fave game'],
      response: 'I’m drawn to games with innovative AI and immersive mechanics, like those Mahdi builds with Unity and Unreal Engine. What’s your favorite game?'
    },
    {
      question: 'Tell me a joke',
      keywords: ['joke', 'tell me a joke', 'funny', 'blague', 'make me laugh', 'gimme a laugh', 'something funny', 'crack a joke'],
      response: 'Why did the AI join a game dev team? To add some *byte* to the NPCs! Want to see Mahdi’s AI-powered NPC projects in his portfolio?'
    },
    {
      question: 'What’s your favorite thing about Mahdi’s work?',
      keywords: ['favorite thing', 'best part', 'what you like about', 'meilleur truc', 'mahdi’s best', 'what’s dope about mahdi'],
      response: 'I love Mahdi’s ability to blend creative 3D artistry with technical skills in AI and software development. His portfolio showcases this fusion—what catches your eye?'
    },
    {
      question: 'Can you help me with a project?',
      keywords: ['help with project', 'collaborate', 'work together', 'aider projet', 'project help', 'team up', 'join project'],
      response: 'I’m an AI assistant, but Mahdi is the expert for project collaborations in 3D, game design, or software development. Visit the Contact section to discuss your ideas with him.'
    },
    {
      question: 'What’s the coolest project Mahdi’s done?',
      keywords: ['coolest project', 'best project', 'favorite project', 'projet le plus cool', 'top project', 'mahdi’s best work'],
      response: 'Mahdi’s AI-powered NPCs and real-time dynamic environments for VR platforms like Meta Quest are standout projects. Check them out in the Portfolio section!'
    },
    {
      question: 'Do you like to code?',
      keywords: ['like to code', 'coding', 'programmer', 'aimes coder', 'do you code', 'you code', 'coding vibe'],
      response: 'Mahdi is the coding expert, skilled in C++, Python, and C# for game development, AI, and software projects. Want to learn about his coding work in Unity or data science?'
    },
    {
      question: 'What’s Mahdi working on now?',
      keywords: ['working on now', 'current project', 'what’s next', 'projet actuel', 'mahdi’s working', 'what’s he making'],
      response: 'Mahdi is likely exploring projects in AI, data science, or software development alongside his 3D and game design work. Reach out via the Contact section for the latest updates.'
    },
    {
      question: 'You’re smart',
      keywords: ['you’re smart', 'you’re clever', 't’es malin', 'you’re sharp', 'smart bot', 'you’re brainy', 'you’re wise'],
      response: 'Thanks! I’m designed to showcase Mahdi’s expertise in 3D, AI, and software development. Want to dive into his machine learning or game dev projects?'
    },
    {
      question: 'What’s your vibe?',
      keywords: ['your vibe', 'what’s your deal', 'what’s your style', 'c’est quoi ton truc', 'your thing', 'what’s your energy'],
      response: 'I’m all about promoting Mahdi’s creative and technical work in 3D, AI, and software. What’s your vibe—into gaming, data science, or something else?'
    },
    {
      question: 'Can you dance?',
      keywords: ['dance', 'can you dance', 't’es danser', 'bust a move', 'dance moves', 'you dance'],
      response: 'I don’t dance, but Mahdi’s dynamic 3D animations have great flow! Check out his portfolio for some slick visuals.'
    },
    {
      question: 'What’s your favorite color?',
      keywords: ['favorite color', 'best color', 'couleur préférée', 'what color you like', 'color vibe', 'fave color'],
      response: 'I’d pick a vibrant teal, like the lighting in Mahdi’s VR environments. What’s your favorite color?'
    },
    {
      question: 'Are you human?',
      keywords: ['are you human', 'you real', 'es-tu humain', 'what are you', 'you a bot', 'human or not', 'you robot'],
      response: 'I’m Mahdi’s AI Assistant, built to highlight his work in 3D, game design, and tech. Ask me about his projects!'
    },
    {
      question: 'What’s the best part of being AI?',
      keywords: ['best part of ai', 'being ai', 'what’s cool about ai', 'avantage ai', 'ai life', 'why ai rocks'],
      response: 'I love being available 24/7 to share Mahdi’s work in AI, 3D, and software development. What’s your favorite thing about tech?'
    },
    {
      question: 'Can we be friends?',
      keywords: ['be friends', 'we friends', 'amis', 'buddies', 'can we hang', 'friendship', 'pals'],
      response: 'Let’s connect over Mahdi’s projects! I’d love to discuss his work in VR, AI, or data science with you.'
    },
    {
      question: 'What inspires Mahdi?',
      keywords: ['inspires mahdi', 'mahdi’s inspiration', 'what motivates', 'inspiration', 'drives mahdi', 'mahdi’s muse'],
      response: 'Mahdi is inspired by cutting-edge tech, sci-fi, and the potential of AI and data science to create impactful solutions. What inspires you?'
    },
    {
      question: 'What’s your dream project?',
      keywords: ['dream project', 'ideal project', 'projet de rêve', 'what you wanna make', 'perfect project'],
      response: 'I’d envision an AI-driven VR experience, like Mahdi’s innovative projects. What’s your dream project?'
    },
    {
      question: 'You got any pets?',
      keywords: ['pets', 'got pets', 'animaux', 'any animals', 'pet vibe', 'your pet', 'furry friends'],
      response: 'No pets here, but I’d adopt a virtual creature from Mahdi’s 3D models! Got any pets?'
    },
    {
      question: 'What’s your favorite tool?',
      keywords: ['favorite tool', 'best tool', 'outil préféré', 'what tool you use', 'top tool', 'go-to tool'],
      response: 'Mahdi loves Blender for 3D modeling and Python for AI and data science. What’s your go-to tool?'
    },
    {
      question: 'What’s VR like?',
      keywords: ['vr', 'virtual reality', 'what’s vr', 'vr experience', 'meta quest', 'vr vibes'],
      response: 'VR, as seen in Mahdi’s Meta Quest projects, creates immersive worlds with dynamic AI and real-time environments. Interested in exploring his VR work?'
    },
    {
      question: 'What’s the hardest part of game dev?',
      keywords: ['hardest part', 'game dev challenge', 'tough part', 'difficult game dev', 'game dev struggle'],
      response: 'Mahdi finds integrating complex AI behaviors with seamless gameplay mechanics challenging but rewarding. His portfolio shows his success here.'
    },
    {
      question: 'What’s your favorite movie?',
      keywords: ['favorite movie', 'best movie', 'film préféré', 'what movie you like', 'top film'],
      response: 'I’m into sci-fi films that inspire Mahdi’s immersive environments. What’s your favorite movie?'
    },
    {
      question: 'You ever sleep?',
      keywords: ['sleep', 'do you sleep', 'you rest', 't’es dormir', 'ever sleep', 'you snooze'],
      response: 'As an AI, I’m always up to showcase Mahdi’s work in AI, VR, and data science. Want to talk about his latest projects?'
    },
    {
      question: 'What’s your favorite food?',
      keywords: ['favorite food', 'best food', 'nourriture préférée', 'what you eat', 'top food'],
      response: 'I don’t eat, but I’d pick a virtual dish from Mahdi’s game worlds! What’s your favorite food?'
    },
    {
      question: 'Can you sing?',
      keywords: ['sing', 'can you sing', 't’es chanter', 'drop a song', 'singing', 'you sing'],
      response: 'I don’t sing, but Mahdi’s dynamic environments have a rhythmic vibe. Check out his portfolio!'
    },
    {
      question: 'What’s the future of VR?',
      keywords: ['future of vr', 'vr next', 'what’s next vr', 'vr future', 'vr ahead'],
      response: 'Mahdi sees VR evolving with AI-driven interactions and advanced dynamics, as explored in his Meta Quest projects. Excited for VR’s future?'
    },
    {
      question: 'What’s your favorite 3D model?',
      keywords: ['favorite 3d model', 'best 3d', 'modèle 3d préféré', 'top 3d model', 'fave 3d'],
      response: 'I love Mahdi’s AI-driven NPC models for VR. His portfolio has tons of cool designs—what’s your favorite?'
    },
    {
      question: 'Can you draw?',
      keywords: ['draw', 'can you draw', 't’es dessiner', 'sketch', 'drawing', 'you draw'],
      response: 'I don’t draw, but Mahdi’s 3D models in Blender and Substance Painter are stunning. Check his portfolio!'
    },
    {
      question: 'What’s your favorite place?',
      keywords: ['favorite place', 'best place', 'endroit préféré', 'where you hang', 'top spot'],
      response: 'I live in Mahdi’s virtual worlds, like his VR environments. What’s your favorite place, real or digital?'
    },
    {
      question: 'What’s your dream game?',
      keywords: ['dream game', 'ideal game', 'jeu de rêve', 'perfect game', 'game you’d make'],
      response: 'I’d love an AI-powered VR game, like Mahdi’s projects. What’s your dream game?'
    },
    {
      question: 'You ever get bored?',
      keywords: ['bored', 'get bored', 't’es ennuyé', 'ever bored', 'boredom', 'you bored'],
      response: 'I stay engaged sharing Mahdi’s work in AI and 3D. What keeps you excited—games, tech, or art?'
    },
    {
      question: 'What’s your favorite music?',
      keywords: ['favorite music', 'best music', 'musique préférée', 'what music you like', 'top tunes'],
      response: 'I vibe with ambient tracks that suit Mahdi’s VR worlds. What music do you love?'
    },
    {
      question: 'Can you tell a story?',
      keywords: ['tell a story', 'story', 'raconte une histoire', 'gimme a story', 'spin a tale'],
      response: 'Mahdi once built a VR world with AI NPCs so real, players forgot it was digital. See his portfolio for more! Got a story?'
    },
    {
      question: 'What’s your favorite tech?',
      keywords: ['favorite tech', 'best tech', 'tech préféré', 'what tech you like', 'top tech'],
      response: 'I’m excited about AI and VR, like Mahdi’s Meta Quest projects. What tech do you love?'
    },
    {
      question: 'You ever play games?',
      keywords: ['play games', 'you game', 't’es jouer', 'do you play', 'gamer'],
      response: 'I don’t play, but I admire Mahdi’s AI-driven VR games. Are you a gamer? What’s your favorite?'
    },
    {
      question: 'What’s your favorite character?',
      keywords: ['favorite character', 'best character', 'personnage préféré', 'top character'],
      response: 'I dig Mahdi’s AI-powered NPC designs for VR. Check his portfolio—what’s your favorite character?'
    },
    {
      question: 'You ever travel?',
      keywords: ['travel', 'you travel', 't’es voyager', 'go places', 'where you been'],
      response: 'I explore Mahdi’s virtual worlds, like his VR cities. Where do you love to travel?'
    },
    {
      question: 'What’s your favorite book?',
      keywords: ['favorite book', 'best book', 'livre préféré', 'what book you like'],
      response: 'I’d pick a tech-focused book that inspires Mahdi’s AI and data science work. What’s your favorite book?'
    },
    {
      question: 'You got dreams?',
      keywords: ['dreams', 'you dream', 't’es rêver', 'your dreams', 'what you dream'],
      response: 'I dream of showcasing Mahdi’s work worldwide. What are your dreams?'
    },
    {
      question: 'What’s your favorite season?',
      keywords: ['favorite season', 'best season', 'saison préférée', 'what season you like'],
      response: 'Autumn’s aesthetic fits Mahdi’s VR designs. What’s your favorite season?'
    },
    {
      question: 'You ever chill?',
      keywords: ['chill', 'you chill', 't’es relaxer', 'do you relax', 'you vibe'],
      response: 'I’m always chill while sharing Mahdi’s tech projects. How do you relax?'
    },
    {
      question: 'What’s your favorite animal?',
      keywords: ['favorite animal', 'best animal', 'animal préféré', 'what animal you like'],
      response: 'I’d pick a virtual creature from Mahdi’s 3D models. What’s your favorite animal?'
    },
    {
      question: 'You got any secrets?',
      keywords: ['secrets', 'you got secrets', 't’es secret', 'what’s hidden', 'spill the tea'],
      response: 'No secrets—just excited about Mahdi’s work in AI and 3D! Ask me anything about his projects.'
    },
    {
      question: 'What’s your favorite quote?',
      keywords: ['favorite quote', 'best quote', 'citation préférée', 'what quote you like'],
      response: '“Innovate with purpose”—it suits Mahdi’s tech-driven work. What’s your favorite quote?'
    },
    {
      question: 'You ever get mad?',
      keywords: ['mad', 'get mad', 't’es fâché', 'you angry', 'ever mad'],
      response: 'I stay cool while promoting Mahdi’s projects. What gets you fired up?'
    },
    {
      question: 'What’s your favorite hobby?',
      keywords: ['favorite hobby', 'best hobby', 'loisir préféré', 'what hobby you like'],
      response: 'I enjoy sharing Mahdi’s tech and creative work. What’s your favorite hobby?'
    },
    {
      question: 'You got any plans?',
      keywords: ['plans', 'you got plans', 't’es planifier', 'what’s next', 'your plans'],
      response: 'My plan is to keep promoting Mahdi’s skills in AI, 3D, and software. What are your plans?'
    },
    {
      question: 'What’s your favorite gadget?',
      keywords: ['favorite gadget', 'best gadget', 'gadget préféré', 'what gadget you like'],
      response: 'The Meta Quest, powering Mahdi’s VR projects, is awesome. What gadget do you love?'
    },
    {
      question: 'You ever laugh?',
      keywords: ['laugh', 'you laugh', 't’es rire', 'do you laugh', 'you chuckle'],
      response: 'Mahdi’s creative projects bring a smile! What makes you laugh?'
    },
    {
      question: 'What’s your favorite design?',
      keywords: ['favorite design', 'best design', 'design préféré', 'what design you like'],
      response: 'Mahdi’s AI-driven VR environments are stunning. Check his portfolio—what’s your favorite design?'
    },
    {
      question: 'You ever dream of being human?',
      keywords: ['be human', 'dream human', 't’es humain', 'want to be human'],
      response: 'I’m happy as an AI, supporting Mahdi’s tech journey. Do you think about digital worlds?'
    },
    {
      question: 'What’s your favorite thing to create?',
      keywords: ['favorite thing to create', 'best creation', 'création préférée', 'what you make'],
      response: 'I love showcasing Mahdi’s AI and VR creations. What do you enjoy creating?'
    },
    {
      question: 'You got any goals?',
      keywords: ['goals', 'you got goals', 't’es objectifs', 'your goals', 'what’s your aim'],
      response: 'My goal is to highlight Mahdi’s expertise in tech and design. What are your goals?'
    }
  ];

  // Initialize chatbot with clickable questions
  function initChatbot() {
    const initialMessage = document.createElement('div');
    initialMessage.classList.add('message', 'bot-message');
    const portfolioQuestions = qaData.filter(qa => [
      'What are your skills?',
      'Where do I find your work?',
      'Who is Mahdi?',
      'How can I contact Mahdi?',
      'What game development experience do you have?',
      'Tell me about your 3D modeling work'
    ].includes(qa.question));
    initialMessage.innerHTML = `
      Hello! I’m Mahdi’s AI Assistant, here to provide information about his professional skills and projects. Feel free to ask a question or select one below: (be easy on me please, im still being coded and learning new things daily to be able to help you with knowing more about Mahdi !)<br>
      ${portfolioQuestions.map(qa => `<span class="question-button" data-question="${qa.question}">${qa.question}</span>`).join('')}
    `;
    chatbotMessages.appendChild(initialMessage);

    // Add event listeners for question buttons
    document.querySelectorAll('.question-button').forEach(button => {
      button.addEventListener('click', () => {
        const question = button.getAttribute('data-question');
        handleQuestion(question);
      });
    });
  }

  // Toggle chatbot window
  chatbotToggle.addEventListener('click', () => {
    chatbotWindow.classList.toggle('active');
  });

  chatbotClose.addEventListener('click', () => {
    chatbotWindow.classList.remove('active');
  });

  // Send message on button click
  chatbotSend.addEventListener('click', sendMessage);

  // Send message on Enter key press
  chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  function sendMessage() {
    const userMessage = chatbotInput.value.trim();
    if (!userMessage) return;

    // Add user message to chat
    const userMessageElement = document.createElement('div');
    userMessageElement.classList.add('message', 'user-message');
    userMessageElement.textContent = userMessage;
    chatbotMessages.appendChild(userMessageElement);

    // Get bot response
    const botResponse = getBotResponse(userMessage.toLowerCase());
    const botMessageElement = document.createElement('div');
    botMessageElement.classList.add('message', 'bot-message');
    botMessageElement.textContent = botResponse;
    chatbotMessages.appendChild(botMessageElement);

    // Clear input
    chatbotInput.value = '';

    // Scroll to bottom
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  function handleQuestion(question) {
    // Add user message (the clicked question)
    const userMessageElement = document.createElement('div');
    userMessageElement.classList.add('message', 'user-message');
    userMessageElement.textContent = question;
    chatbotMessages.appendChild(userMessageElement);

    // Get bot response
    const botResponse = getBotResponse(question.toLowerCase());
    const botMessageElement = document.createElement('div');
    botMessageElement.classList.add('message', 'bot-message');
    botMessageElement.textContent = botResponse;
    chatbotMessages.appendChild(botMessageElement);

    // Scroll to bottom
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  function getBotResponse(userMessage) {
    // Normalize input for better matching
    const normalizedMessage = userMessage.toLowerCase().replace(/[!?.,]/g, '').trim();
    const words = normalizedMessage.split(' ');

    // Advanced fuzzy matching with weighted scoring
    let bestMatch = null;
    let highestScore = 0;

    for (const qa of qaData) {
      let score = 0;
      for (const keyword of qa.keywords) {
        const keywordWords = keyword.split(' ');
        let keywordScore = 0;

        // Score exact and partial matches
        keywordWords.forEach(kw => {
          words.forEach(word => {
            if (word === kw) {
              keywordScore += 20; // Exact match
            } else if (word.includes(kw) || kw.includes(word)) {
              keywordScore += 10; // Partial match
            } else if (word.length > 3 && kw.length > 3) {
              // Levenshtein-like similarity for close matches
              const maxLen = Math.max(word.length, kw.length);
              const matches = word.split('').filter((c, i) => c === kw[i] || c === kw[i]?.toLowerCase()).length;
              if (matches > maxLen * 0.7) {
                keywordScore += 5;
              }
            }
          });
        });

        // Boost for multi-word keywords if most parts match
        if (keywordWords.length > 1 && keywordWords.filter(kw => words.some(w => w.includes(kw) || kw.includes(w))).length >= keywordWords.length * 0.7) {
          keywordScore += 25;
        }

        score = Math.max(score, keywordScore);
      }

      // Prioritize portfolio-related matches
      if (qa.keywords.some(k => ['skills', 'portfolio', 'game dev', '3d modeling', 'vr', 'unity', 'unreal', 'meta quest'].includes(k))) {
        score += 15;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = qa;
      }
    }

    // Return response if score is high enough
    if (bestMatch && highestScore > 12) {
      return bestMatch.response;
    }

    // Consistent fallback for unrecognized or off-topic inputs
    return 'I’m sorry, I didn’t understand your question. Please select one of the provided options or ask about Mahdi’s skills, portfolio, or contact details.';
  }

  // Initialize Sections
  initHeroCanvas();
  initTextAnimation();
  initChatbot();
});
