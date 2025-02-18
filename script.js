document.addEventListener("DOMContentLoaded", () => {
  // Dots Animation Logic
  const dotsContainer = document.getElementById("dots-container");
  const dotsCount = 2000;
  const interactionDistance = 100;
  const maxVelocity = 2;

  let dots = [];
  let isCreepyEffectActive = false;
  let creepyEffectTimeout;

  // Function to create dots
  function createDots() {
    for (let i = 0; i < dotsCount; i++) {
      const dot = document.createElement("div");
      dot.classList.add("dot");

      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      const vx = (Math.random() - 0.5) * maxVelocity;
      const vy = (Math.random() - 0.5) * maxVelocity;
      const size = Math.random() * 4 + 1; // Random size for depth
      const z = Math.random(); // Simulate depth (0 = far, 1 = close)

      dots.push({ element: dot, x, y, vx, vy, size, z });

      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;

      dotsContainer.appendChild(dot);
    }
  }

  // Function to update dots' positions
  function updateDots() {
    const now = Date.now();
    const pulseIntensity = Math.sin(now * 0.002) * 0.5 + 1; // Pulsing effect

    dots.forEach((dot) => {
      // Simulate depth: closer dots move faster, farther dots move slower
      const depthFactor = dot.z * 2; // Adjust speed based on depth
      dot.x += dot.vx * depthFactor;
      dot.y += dot.vy * depthFactor;

      // Bounce off walls
      if (dot.x <= 0 || dot.x >= window.innerWidth) dot.vx *= -1;
      if (dot.y <= 0 || dot.y >= window.innerHeight) dot.vy *= -1;

      // Pulsing effect for creepy vibe
      dot.element.style.transform = `scale(${pulseIntensity * dot.z})`;

      // Update dot position on screen
      dot.element.style.left = `${dot.x}px`;
      dot.element.style.top = `${dot.y}px`;
    });

    // Occasionally cluster dots randomly for a creepy effect
    if (isCreepyEffectActive) {
      const clusterCenterX = Math.random() * window.innerWidth;
      const clusterCenterY = Math.random() * window.innerHeight;

      dots.forEach((dot) => {
        const dx = clusterCenterX - dot.x;
        const dy = clusterCenterY - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 300) {
          // Move dots towards the cluster center
          dot.x += dx * 0.02;
          dot.y += dy * 0.02;
        }
      });
    }

    requestAnimationFrame(updateDots);
  }

  // Function to activate creepy effect
  function activateCreepyEffect() {
    isCreepyEffectActive = true;

    // Deactivate after 5 seconds
    creepyEffectTimeout = setTimeout(() => {
      isCreepyEffectActive = false;

      // Schedule the next creepy effect
      setTimeout(activateCreepyEffect, 30000); // 30 seconds
    }, 5000); // 5 seconds
  }

  // Mouse interaction
  document.addEventListener("mousemove", (event) => {
    const { clientX, clientY } = event;

    dots.forEach((dot) => {
      const dx = clientX - dot.x;
      const dy = clientY - dot.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < interactionDistance) {
        const angle = Math.atan2(dy, dx);
        const force = (interactionDistance - distance) / interactionDistance;

        // Push dots away from the mouse
        dot.vx -= Math.cos(angle) * force * 0.5;
        dot.vy -= Math.sin(angle) * force * 0.5;
      }
    });
  });

  // Start the animation
  createDots();
  updateDots();

  // Start the creepy effect loop
  setTimeout(activateCreepyEffect, 30000); // Initial delay of 30 seconds

  // Carousel Logic
  const carousel = document.querySelector(".carousel");
  const carouselImages = document.querySelector(".carousel-images");
  const carouselItems = document.querySelectorAll(".carousel-item");
  const arrowLeft = document.querySelector(".arrow-left");
  const arrowRight = document.querySelector(".arrow-right");

  let currentIndex = 0;
  let autoPlayInterval;

  // Function to show the current slide
  function showSlide(index) {
    const offset = -index * 100; // Calculate the offset based on the index
    carouselImages.style.transform = `translateX(${offset}%)`; // Move the carousel
  }

  // Function to move to the next slide
  function nextSlide() {
    currentIndex = (currentIndex + 1) % carouselItems.length;
    showSlide(currentIndex);
  }

  // Function to move to the previous slide
  function prevSlide() {
    currentIndex = (currentIndex - 1 + carouselItems.length) % carouselItems.length;
    showSlide(currentIndex);
  }

  // Function to start auto-play
  function startAutoPlay() {
    autoPlayInterval = setInterval(nextSlide, 10000); // Change slide every 10 seconds
  }

  // Function to stop auto-play
  function stopAutoPlay() {
    clearInterval(autoPlayInterval);
  }

  // Event listeners for arrow buttons
  arrowLeft.addEventListener("click", () => {
    prevSlide();
    stopAutoPlay(); // Stop auto-play when user interacts
    startAutoPlay(); // Restart auto-play after a delay
  });

  arrowRight.addEventListener("click", () => {
    nextSlide();
    stopAutoPlay(); // Stop auto-play when user interacts
    startAutoPlay(); // Restart auto-play after a delay
  });

  // Pause auto-play on hover
  carousel.addEventListener("mouseenter", stopAutoPlay);

  // Resume auto-play on mouse leave
  carousel.addEventListener("mouseleave", startAutoPlay);

  // Show the first slide initially
  showSlide(currentIndex);

  // Start auto-play initially
  startAutoPlay();

  // Contact Form Submission Handling
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent the default form submission

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
            contactForm.reset(); // Clear the form
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
