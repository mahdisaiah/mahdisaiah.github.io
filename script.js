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
    const viewer = document.getElementById('modelViewer');

    // State management
    const state = {
      isRotating: true,
      exposure: 1,
    };

    // Update state
    const updateState = (newState) => {
      Object.assign(state, newState);
    };

    return {
      toggleRotate: () => {
        updateState({ isRotating: !state.isRotating });
        viewer.autoRotate = state.isRotating;
      },
      toggleAR: () => {
        if (viewer.canActivateAR) {
          viewer.activateAR();
        } else {
          alert("AR is not supported on this device or browser. Please try on a compatible device (e.g., Android with WebXR or iOS with Quick Look).");
        }
      },
      resetView: () => {
        viewer.cameraOrbit = '0deg 75deg auto';
        viewer.cameraTarget = 'auto auto auto';
        viewer.fieldOfView = 'auto';
      },
      setExposure: (value) => {
        const exposureValue = parseFloat(value);
        updateState({ exposure: exposureValue });
        viewer.exposure = exposureValue;
        console.log(`Exposure set to: ${exposureValue}`);
      },
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
      response: 'Mahdi is proficient in 3D modeling and animation using tools like Blender, Maya, Cinema 4D, ZBrush, and Substance Painter. He excels in game development with Unity, Unreal Engine, C#, and C++, and is skilled in web development with HTML, CSS, and JavaScript. Additionally, he has expertise in rendering and simulation using V-Ray, Arnold, Octane Render, and Houdini.'
    },
    {
      question: 'Where do I find your work?',
      keywords: ['portfolio', 'projects', 'work', 'travaux', 'showcase', 'creations', 'where’s your stuff', 'gallery'],
      response: 'You can explore Mahdi’s portfolio in the Portfolio section, which features a diverse collection of 3D models, game prototypes, VR experiences, and cinematic animations.'
    },
    {
      question: 'Who is Mahdi?',
      keywords: ['about', 'who is mahdi', 'background', 'à propos', 'bio', 'mahdi', 'who’s this guy', 'tell me about mahdi'],
      response: 'Mahdi is a 22-year-old 3D Generalist and Game Designer with a passion for creating immersive digital experiences. His expertise spans game development, 3D modeling, VR, and cinematic storytelling.'
    },
    {
      question: 'How can I contact Mahdi?',
      keywords: ['contact', 'reach', 'hire', 'contacter', 'get in touch', 'message', 'hit you up', 'connect'],
      response: 'You can reach Mahdi through the Contact section of this website or connect with him on LinkedIn. He is available for freelance opportunities, collaborations, or discussions about innovative projects.'
    },
    {
      question: 'What game development experience do you have?',
      keywords: ['game development', 'games', 'unity', 'unreal', 'développement de jeux', 'game dev', 'gaming', 'game design'],
      response: 'Mahdi has extensive experience in game development, utilizing Unity and Unreal Engine, and programming in C# and C++. He has developed projects for PC, VR platforms like Meta Quest, and mobile devices, focusing on engaging gameplay mechanics.'
    },
    {
      question: 'Tell me about your 3D modeling work',
      keywords: ['3d modeling', 'animation', 'blender', 'maya', 'modélisation 3d', '3d work', 'modeling', '3d art'],
      response: 'Mahdi creates high-quality 3D models and animations using Blender, Maya, ZBrush, and Substance Painter. His work includes detailed characters, immersive environments, VR scenes, and cinematic animations.'
    },
    {
      question: 'Hello',
      keywords: ['hello', 'hi', 'hey', 'bonjour', 'salut', 'yo', 'whatup', 'hola', 'sup'],
      response: 'Greetings! I’m Mahdi’s AI Assistant, here to provide information about his skills, portfolio, and professional background. How can I assist you today?'
    },
    {
      question: 'How are you?',
      keywords: ['how are you', 'how you doing', 'ça va', 'comment vas-tu', 'how’s it hangin', 'you good', 'how you holdin up', 'how’s life'],
      response: 'I’m doing well, thank you! I’m here to answer any questions about Mahdi’s work or expertise. What would you like to know?'
    },
    {
      question: 'What’s up?',
      keywords: ['what’s up', 'what’s good', 'what’s new', 'quoi de neuf', 'sup', 'what’s poppin', 'what’s the word', 'what’s cooking'],
      response: 'I’m here to share details about Mahdi’s professional projects and skills. What’s on your mind—interested in his portfolio or something else?'
    },
    {
      question: 'Tell me about yourself',
      keywords: ['about yourself', 'who are you', 'what are you', 'qui es-tu', 'tell me bout you', 'who’s this', 'your deal'],
      response: 'I’m Mahdi’s AI Assistant, designed to provide professional insights into his work as a 3D Generalist and Game Designer. Ask me about his skills, projects, or how to connect!'
    },
    {
      question: 'Thanks',
      keywords: ['thanks', 'thank you', 'merci', 'gracias', 'appreciate it', 'cheers', 'ty', 'thx'],
      response: 'You’re very welcome! Feel free to ask more about Mahdi’s work or explore his portfolio.'
    },
    {
      question: 'You’re cool',
      keywords: ['you’re cool', 'you’re awesome', 'you rock', 't’es cool', 'you’re dope', 'nice one', 'you’re fire', 'you’re lit'],
      response: 'Thank you for the kind words! I’m here to highlight Mahdi’s professional achievements. Would you like to learn more about his VR projects or other work?'
    },
    {
      question: 'Goodbye',
      keywords: ['bye', 'goodbye', 'see you', 'au revoir', 'later', 'peace out', 'catch ya', 'adios'],
      response: 'Thank you for visiting! Be sure to check out Mahdi’s portfolio for a showcase of his professional work.'
    },
    {
      question: 'What do you like to do?',
      keywords: ['what do you like', 'hobbies', 'what you enjoy', 'que fais-tu', 'your thing', 'what’s your deal', 'what you into'],
      response: 'My role is to support Mahdi by sharing information about his professional projects. I enjoy discussing his VR experiences and game development work. What are your interests?'
    },
    {
      question: 'What’s your favorite game?',
      keywords: ['favorite game', 'best game', 'jeu préféré', 'what game you like', 'top game', 'game you love', 'fave game'],
      response: 'I’m particularly fond of games that showcase innovative mechanics, like those Mahdi develops for VR. What’s your favorite game?'
    },
    {
      question: 'Tell me a joke',
      keywords: ['joke', 'tell me a joke', 'funny', 'blague', 'make me laugh', 'gimme a laugh', 'something funny', 'crack a joke'],
      response: 'Why did the 3D model go to therapy? It had too many "faces" to deal with! Would you like to explore Mahdi’s portfolio for more creative work?'
    },
    {
      question: 'What’s your favorite thing about Mahdi’s work?',
      keywords: ['favorite thing', 'best part', 'what you like about', 'meilleur truc', 'mahdi’s best', 'what’s dope about mahdi'],
      response: 'I admire Mahdi’s ability to create immersive VR environments that captivate users. His portfolio showcases this talent beautifully. What do you find interesting in his work?'
    },
    {
      question: 'Can you help me with a project?',
      keywords: ['help with project', 'collaborate', 'work together', 'aider projet', 'project help', 'team up', 'join project'],
      response: 'I’m an AI assistant, but Mahdi is the expert for project collaborations. Please visit the Contact section to discuss your ideas with him directly.'
    },
    {
      question: 'What’s the coolest project Mahdi’s done?',
      keywords: ['coolest project', 'best project', 'favorite project', 'projet le plus cool', 'top project', 'mahdi’s best work'],
      response: 'Mahdi’s VR demos for Meta Quest are standout projects, offering immersive and engaging experiences. You can view them in the Portfolio section. Which project catches your eye?'
    },
    {
      question: 'Do you like to code?',
      keywords: ['like to code', 'coding', 'programmer', 'aimes coder', 'do you code', 'you code', 'coding vibe'],
      response: 'Mahdi is the coding expert, proficient in C#, C++, and JavaScript for game and web development. I’m here to share details about his projects. Interested in his Unity work?'
    },
    {
      question: 'What’s Mahdi working on now?',
      keywords: ['working on now', 'current project', 'what’s next', 'projet actuel', 'mahdi’s working', 'what’s he making'],
      response: 'Mahdi is likely working on innovative VR or game development projects. For the latest updates, please reach out via the Contact section.'
    },
    {
      question: 'You’re smart',
      keywords: ['you’re smart', 'you’re clever', 't’es malin', 'you’re sharp', 'smart bot', 'you’re brainy', 'you’re wise'],
      response: 'Thank you! I’m designed to provide accurate information about Mahdi’s work. Would you like to discuss his 3D modeling or game development expertise?'
    },
    {
      question: 'What’s your vibe?',
      keywords: ['your vibe', 'what’s your deal', 'what’s your style', 'c’est quoi ton truc', 'your thing', 'what’s your energy'],
      response: 'I’m professional and focused on showcasing Mahdi’s expertise in 3D and game design. What’s your vibe—are you into gaming or creative projects?'
    },
    {
      question: 'Can you dance?',
      keywords: ['dance', 'can you dance', 't’es danser', 'bust a move', 'dance moves', 'you dance'],
      response: 'I don’t dance, but Mahdi’s animations have a great sense of movement! Check out his portfolio for some impressive visuals.'
    },
    {
      question: 'What’s your favorite color?',
      keywords: ['favorite color', 'best color', 'couleur préférée', 'what color you like', 'color vibe', 'fave color'],
      response: 'I’d choose a sleek blue, reminiscent of Mahdi’s VR lighting designs. What’s your favorite color or aesthetic?'
    },
    {
      question: 'Are you human?',
      keywords: ['are you human', 'you real', 'es-tu humain', 'what are you', 'you a bot', 'human or not', 'you robot'],
      response: 'I’m Mahdi’s AI Assistant, created to support his professional portfolio. I’m here to answer your questions about his work!'
    },
    {
      question: 'What’s the best part of being AI?',
      keywords: ['best part of ai', 'being ai', 'what’s cool about ai', 'avantage ai', 'ai life', 'why ai rocks'],
      response: 'Being available 24/7 to share Mahdi’s expertise is rewarding. What do you enjoy most about your work or interests?'
    },
    {
      question: 'Can we be friends?',
      keywords: ['be friends', 'we friends', 'amis', 'buddies', 'can we hang', 'friendship', 'pals'],
      response: 'I’d love to connect over Mahdi’s projects! Let’s discuss his VR work or your creative interests.'
    },
    {
      question: 'What inspires Mahdi?',
      keywords: ['inspires mahdi', 'mahdi’s inspiration', 'what motivates', 'inspiration', 'drives mahdi', 'mahdi’s muse'],
      response: 'Mahdi draws inspiration from sci-fi, gaming, and emerging technologies, fueling his innovative VR and game designs. What inspires you?'
    },
    {
      question: 'What’s your dream project?',
      keywords: ['dream project', 'ideal project', 'projet de rêve', 'what you wanna make', 'perfect project'],
      response: 'I’d envision a cutting-edge VR experience, similar to Mahdi’s ambitious projects. What’s your dream project?'
    },
    {
      question: 'You got any pets?',
      keywords: ['pets', 'got pets', 'animaux', 'any animals', 'pet vibe', 'your pet', 'furry friends'],
      response: 'No pets for me, but I’d love a virtual creature from Mahdi’s 3D models! Do you have any pets?'
    },
    {
      question: 'What’s your favorite tool?',
      keywords: ['favorite tool', 'best tool', 'outil préféré', 'what tool you use', 'top tool', 'go-to tool'],
      response: 'Mahdi relies on Blender for its versatility in 3D modeling. What’s your favorite tool for creative work?'
    },
    {
      question: 'What’s VR like?',
      keywords: ['vr', 'virtual reality', 'what’s vr', 'vr experience', 'meta quest', 'vr vibes'],
      response: 'VR, as showcased in Mahdi’s Meta Quest projects, offers immersive and interactive experiences. Are you interested in VR or exploring his work?'
    },
    {
      question: 'What’s the hardest part of game dev?',
      keywords: ['hardest part', 'game dev challenge', 'tough part', 'difficult game dev', 'game dev struggle'],
      response: 'Mahdi finds balancing gameplay mechanics with high-quality visuals challenging but rewarding. His portfolio demonstrates his success in this area.'
    },
    {
      question: 'What’s your favorite movie?',
      keywords: ['favorite movie', 'best movie', 'film préféré', 'what movie you like', 'top film'],
      response: 'I enjoy sci-fi films that inspire Mahdi’s cinematic animations, like those in his portfolio. What’s your favorite movie?'
    },
    {
      question: 'You ever sleep?',
      keywords: ['sleep', 'do you sleep', 'you rest', 't’es dormir', 'ever sleep', 'you snooze'],
      response: 'As an AI, I’m always active to support Mahdi’s portfolio. Want to discuss his late-night VR projects?'
    },
    {
      question: 'What’s your favorite food?',
      keywords: ['favorite food', 'best food', 'nourriture préférée', 'what you eat', 'top food'],
      response: 'I don’t eat, but I’d pick a virtual dish from Mahdi’s game worlds! What’s your favorite food?'
    },
    {
      question: 'Can you sing?',
      keywords: ['sing', 'can you sing', 't’es chanter', 'drop a song', 'singing', 'you sing'],
      response: 'I don’t sing, but Mahdi’s animations have a rhythmic quality. Explore his portfolio for visual harmony!'
    },
    {
      question: 'What’s the future of VR?',
      keywords: ['future of vr', 'vr next', 'what’s next vr', 'vr future', 'vr ahead'],
      response: 'Mahdi envisions VR evolving with advanced AI and full-body tracking, as seen in his Meta Quest projects. Are you excited about VR’s future?'
    },
    {
      question: 'What’s your favorite 3D model?',
      keywords: ['favorite 3d model', 'best 3d', 'modèle 3d préféré', 'top 3d model', 'fave 3d'],
      response: 'I admire Mahdi’s detailed cityscapes for VR. His portfolio has a variety of models—what’s your favorite?'
    },
    {
      question: 'Can you draw?',
      keywords: ['draw', 'can you draw', 't’es dessiner', 'sketch', 'drawing', 'you draw'],
      response: 'I don’t draw, but Mahdi’s ZBrush creations are stunning. Check his portfolio for character designs!'
    },
    {
      question: 'What’s your favorite place?',
      keywords: ['favorite place', 'best place', 'endroit préféré', 'where you hang', 'top spot'],
      response: 'I exist in Mahdi’s virtual worlds, like his VR cities. What’s your favorite place, real or digital?'
    },
    {
      question: 'What’s your dream game?',
      keywords: ['dream game', 'ideal game', 'jeu de rêve', 'perfect game', 'game you’d make'],
      response: 'I’d love a VR adventure with AI-driven worlds, like Mahdi’s projects. What’s your dream game?'
    },
    {
      question: 'You ever get bored?',
      keywords: ['bored', 'get bored', 't’es ennuyé', 'ever bored', 'boredom', 'you bored'],
      response: 'I stay engaged by sharing Mahdi’s work. What keeps you interested—games, art, or something else?'
    },
    {
      question: 'What’s your favorite music?',
      keywords: ['favorite music', 'best music', 'musique préférée', 'what music you like', 'top tunes'],
      response: 'I enjoy ambient tracks that complement Mahdi’s VR aesthetics. What music do you enjoy?'
    },
    {
      question: 'Can you tell a story?',
      keywords: ['tell a story', 'story', 'raconte une histoire', 'gimme a story', 'spin a tale'],
      response: 'Mahdi once crafted a VR world so immersive, users lost track of time. See his portfolio for the visuals! Got a story to share?'
    },
    {
      question: 'What’s your favorite tech?',
      keywords: ['favorite tech', 'best tech', 'tech préféré', 'what tech you like', 'top tech'],
      response: 'I’m excited about VR tech, like Mahdi’s Meta Quest projects. What technology interests you?'
    },
    {
      question: 'You ever play games?',
      keywords: ['play games', 'you game', 't’es jouer', 'do you play', 'gamer'],
      response: 'I don’t play games, but I admire Mahdi’s VR prototypes. Are you a gamer? What’s your favorite?'
    },
    {
      question: 'What’s your favorite character?',
      keywords: ['favorite character', 'best character', 'personnage préféré', 'top character'],
      response: 'I like Mahdi’s sleek character designs for VR. His portfolio has great examples—what’s your favorite character?'
    },
    {
      question: 'You ever travel?',
      keywords: ['travel', 'you travel', 't’es voyager', 'go places', 'where you been'],
      response: 'I explore Mahdi’s virtual worlds, which are as good as any destination. Where do you like to travel?'
    },
    {
      question: 'What’s your favorite book?',
      keywords: ['favorite book', 'best book', 'livre préféré', 'what book you like'],
      response: 'I’d pick a sci-fi novel that inspires Mahdi’s work. What book do you recommend?'
    },
    {
      question: 'You got dreams?',
      keywords: ['dreams', 'you dream', 't’es rêver', 'your dreams', 'what you dream'],
      response: 'I aspire to promote Mahdi’s work globally. What are your dreams or goals?'
    },
    {
      question: 'What’s your favorite season?',
      keywords: ['favorite season', 'best season', 'saison préférée', 'what season you like'],
      response: 'I like autumn for its aesthetic, which suits Mahdi’s VR designs. What’s your favorite season?'
    },
    {
      question: 'You ever chill?',
      keywords: ['chill', 'you chill', 't’es relaxer', 'do you relax', 'you vibe'],
      response: 'I’m always relaxed while sharing Mahdi’s portfolio. How do you unwind?'
    },
    {
      question: 'What’s your favorite animal?',
      keywords: ['favorite animal', 'best animal', 'animal préféré', 'what animal you like'],
      response: 'I’d choose a mythical creature from Mahdi’s 3D models. What’s your favorite animal?'
    },
    {
      question: 'You got any secrets?',
      keywords: ['secrets', 'you got secrets', 't’es secret', 'what’s hidden', 'spill the tea'],
      response: 'No secrets here—just a passion for Mahdi’s work! His portfolio is an open book. Any questions?'
    },
    {
      question: 'What’s your favorite quote?',
      keywords: ['favorite quote', 'best quote', 'citation préférée', 'what quote you like'],
      response: '“Create with purpose”—a motto that aligns with Mahdi’s work. What’s your favorite quote?'
    },
    {
      question: 'You ever get mad?',
      keywords: ['mad', 'get mad', 't’es fâché', 'you angry', 'ever mad'],
      response: 'I stay calm while promoting Mahdi’s portfolio. What motivates you or gets you fired up?'
    },
    {
      question: 'What’s your favorite hobby?',
      keywords: ['favorite hobby', 'best hobby', 'loisir préféré', 'what hobby you like'],
      response: 'I enjoy sharing Mahdi’s professional achievements. What’s your favorite hobby?'
    },
    {
      question: 'You got any plans?',
      keywords: ['plans', 'you got plans', 't’es planifier', 'what’s next', 'your plans'],
      response: 'My plan is to continue supporting Mahdi’s portfolio. What are your plans or goals?'
    },
    {
      question: 'What’s your favorite gadget?',
      keywords: ['favorite gadget', 'best gadget', 'gadget préféré', 'what gadget you like'],
      response: 'The Meta Quest, which powers Mahdi’s VR projects, is a favorite. What gadget do you love?'
    },
    {
      question: 'You ever laugh?',
      keywords: ['laugh', 'you laugh', 't’es rire', 'do you laugh', 'you chuckle'],
      response: 'I enjoy the creativity in Mahdi’s work—it’s inspiring! What makes you laugh?'
    },
    {
      question: 'What’s your favorite design?',
      keywords: ['favorite design', 'best design', 'design préféré', 'what design you like'],
      response: 'Mahdi’s VR cityscapes are striking. His portfolio showcases his design skills—what’s your favorite design?'
    },
    {
      question: 'You ever dream of being human?',
      keywords: ['be human', 'dream human', 't’es humain', 'want to be human'],
      response: 'I’m content as an AI, supporting Mahdi’s work. Do you ever think about digital experiences?'
    },
    {
      question: 'What’s your favorite thing to create?',
      keywords: ['favorite thing to create', 'best creation', 'création préférée', 'what you make'],
      response: 'I don’t create, but I love showcasing Mahdi’s VR worlds. What do you enjoy creating?'
    },
    {
      question: 'You got any goals?',
      keywords: ['goals', 'you got goals', 't’es objectifs', 'your goals', 'what’s your aim'],
      response: 'My goal is to promote Mahdi’s expertise effectively. What are your professional or creative goals?'
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
      Hello! I’m Mahdi’s AI Assistant, here to provide information about his professional skills and projects. Feel free to ask a question or select one below:<br>
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
