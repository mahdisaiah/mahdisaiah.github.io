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

  // Hamburger Menu Toggle
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.querySelector('i').classList.toggle('fa-bars');
    hamburger.querySelector('i').classList.toggle('fa-times');
  });

  // Initialize Hero Section
  initHeroCanvas();
  initTextAnimation();

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
    videoCurrentIndex = (videoCurrentIndex - 1 + videoCarouselItems.length) % videoCarouselItems.length;
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

  videoCarousel.addEventListener("mouseenter", stopAutoPlay);
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
});
