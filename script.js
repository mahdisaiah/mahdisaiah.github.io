document.addEventListener("DOMContentLoaded", () => {
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

});
