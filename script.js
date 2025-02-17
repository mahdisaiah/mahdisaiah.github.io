document.addEventListener("DOMContentLoaded", () => {
  // Dots Functionality for Hero Section (Page 1)
  const dotsContainer = document.getElementById("dots-container");
  const dotsCount = 2000;
  const interactionDistance = 100;
  const collisionRadius = 15;
  const maxVelocity = 1;

  let dots = [];

  function createDots() {
    for (let i = 0; i < dotsCount; i++) {
      const dot = document.createElement("div");
      dot.classList.add("dot");

      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      const vx = (Math.random() - 0.5) * maxVelocity;
      const vy = (Math.random() - 0.5) * maxVelocity;

      dots.push({ element: dot, x, y, vx, vy });

      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;

      dotsContainer.appendChild(dot);
    }
  }

  function updateDots() {
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];

      dot.x += dot.vx;
      dot.y += dot.vy;

      if (dot.x <= 0 || dot.x >= window.innerWidth) dot.vx *= -1;
      if (dot.y <= 0 || dot.y >= window.innerHeight) dot.vy *= -1;

      for (let j = i + 1; j < dots.length; j++) {
        const otherDot = dots[j];
        const dx = otherDot.x - dot.x;
        const dy = otherDot.y - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < collisionRadius) {
          const angle = Math.atan2(dy, dx);
          const overlap = collisionRadius - distance;

          dot.x -= Math.cos(angle) * overlap / 2;
          dot.y -= Math.sin(angle) * overlap / 2;
          otherDot.x += Math.cos(angle) * overlap / 2;
          otherDot.y += Math.sin(angle) * overlap / 2;

          const tempVx = dot.vx;
          const tempVy = dot.vy;
          dot.vx = otherDot.vx;
          dot.vy = otherDot.vy;
          otherDot.vx = tempVx;
          otherDot.vy = tempVy;
        }
      }

      dot.element.style.left = `${dot.x}px`;
      dot.element.style.top = `${dot.y}px`;
    }
  }

  document.addEventListener("mousemove", (event) => {
    const { clientX, clientY } = event;

    dots.forEach((dot) => {
      const dx = clientX - dot.x;
      const dy = clientY - dot.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < interactionDistance) {
        const angle = Math.atan2(dy, dx);
        const force = (interactionDistance - distance) / interactionDistance;

        dot.vx -= Math.cos(angle) * force * 0.5;
        dot.vy -= Math.sin(angle) * force * 0.5;
      }
    });
  });

  function animate() {
    updateDots();
    requestAnimationFrame(animate);
  }

  createDots();
  animate();


// Contact Form Submission Handling
document.getElementById("contact-form").addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent the default form submission

  const form = event.target;
  const formData = new FormData(form);

  fetch(form.action, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => {
      if (response.ok) {
        alert("Thank you for your message! I'll get back to you soon.");
        form.reset(); // Clear the form
      } else {
        alert("Oops! Something went wrong. Please try again.");
      }
    })
    .catch((error) => {
      alert("Oops! Something went wrong. Please try again.");
    });
});


  // Carousel Functionality for Portfolio Section (Page 3)
  const carousel = document.querySelector(".carousel-images");
  const carouselItems = document.querySelectorAll(".carousel-item");
  let currentIndex = 0;

  function showSlide(index) {
    const totalSlides = carouselItems.length;
    currentIndex = (index + totalSlides) % totalSlides; // Wrap around slides
    const offset = -currentIndex * 100; // Calculate offset in percentage
    carousel.style.transform = `translateX(${offset}%)`;
  }

  document.querySelector(".arrow-left").addEventListener("click", () => {
    showSlide(currentIndex - 1); // Show previous slide
  });

  document.querySelector(".arrow-right").addEventListener("click", () => {
    showSlide(currentIndex + 1); // Show next slide
  });

  // Initialize first slide
  showSlide(0);
});
