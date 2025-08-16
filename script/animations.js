// Advanced animations and visual effects for AQUACLIMA dashboard

// Enhanced particle system with multiple layers
// Particle system for floating background elements
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingElements = [];
    this.canvas = null;
    this.ctx = null;
    this.init();
  }

  init() {
    // Create canvas for particles
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '-1';
    this.canvas.style.opacity = '0.15';
    
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    this.resize();
    this.createParticles();
    this.createFloatingElements();
    this.animate();
    
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    const particleCount = Math.floor((window.innerWidth * window.innerHeight) / 12000);
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 4 + 1,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        opacity: Math.random() * 0.6 + 0.3,
        color: `hsl(${200 + Math.random() * 80}, 70%, 60%)`,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  createFloatingElements() {
    const elementCount = Math.floor(window.innerWidth / 400);
    
    for (let i = 0; i < elementCount; i++) {
      this.floatingElements.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 60 + 40,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.1 + 0.05,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.5,
        color: `hsl(${180 + Math.random() * 100}, 60%, 70%)`
      });
    }
  }
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Animate floating elements
    this.floatingElements.forEach(element => {
      element.x += element.speedX;
      element.y += element.speedY;
      element.rotation += element.rotationSpeed;
      
      if (element.x < -element.size) element.x = this.canvas.width + element.size;
      if (element.x > this.canvas.width + element.size) element.x = -element.size;
      if (element.y < -element.size) element.y = this.canvas.height + element.size;
      if (element.y > this.canvas.height + element.size) element.y = -element.size;
      
      this.ctx.save();
      this.ctx.translate(element.x, element.y);
      this.ctx.rotate(element.rotation * Math.PI / 180);
      this.ctx.globalAlpha = element.opacity;
      this.ctx.fillStyle = element.color;
      this.ctx.fillRect(-element.size/2, -element.size/2, element.size, element.size);
      this.ctx.restore();
    });
    
    this.particles.forEach(particle => {
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.pulse += 0.02;
      
      // Wrap around edges
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;
      
      // Pulsing effect
      const pulseSize = particle.size + Math.sin(particle.pulse) * 0.5;
      const pulseOpacity = particle.opacity + Math.sin(particle.pulse) * 0.1;
      
      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.globalAlpha = pulseOpacity;
      this.ctx.fill();
      
      // Add glow effect
      this.ctx.shadowColor = particle.color;
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });
    
    requestAnimationFrame(() => this.animate());
  }
}

// Enhanced scroll animations with stagger effect
// Smooth scroll animations
class ScrollAnimations {
  constructor() {
    this.observedElements = new Set();
    this.animationQueue = [];
    this.init();
  }

  init() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.queueAnimation(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    this.observeElements();
  }

  queueAnimation(element) {
    const delay = this.animationQueue.length * 100;
    this.animationQueue.push(element);
    
    setTimeout(() => {
      element.classList.add('animate-in');
      this.animationQueue = this.animationQueue.filter(el => el !== element);
    }, delay);
  }
  observeElements() {
    const elements = document.querySelectorAll('.sensor-card, .status-card, .info-card, .control-panel');
    elements.forEach(el => {
      if (!this.observedElements.has(el)) {
        el.classList.add('animate-on-scroll');
        this.observer.observe(el);
        this.observedElements.add(el);
      }
    });
  }
}

// Enhanced hover effects with 3D transforms
// Advanced hover effects
class HoverEffects {
  constructor() {
    this.mousePosition = { x: 0, y: 0 };
    this.init();
  }

  init() {
    this.trackMouse();
    this.addCardHoverEffects();
    this.addButtonHoverEffects();
    this.addIconAnimations();
    this.addMagneticEffects();
  }

  trackMouse() {
    document.addEventListener('mousemove', (e) => {
      this.mousePosition.x = e.clientX;
      this.mousePosition.y = e.clientY;
    });
  }
  addCardHoverEffects() {
    const cards = document.querySelectorAll('.sensor-card, .status-card, .info-card');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', (e) => {
        this.createHoverGlow(e.target);
        this.addParallaxEffect(e.target);
      });
      
      card.addEventListener('mouseleave', (e) => {
        this.removeHoverGlow(e.target);
        this.removeParallaxEffect(e.target);
      });
      
      card.addEventListener('mousemove', (e) => {
        this.updateCardTilt(e);
      });
    });
  }

  createHoverGlow(element) {
    const glow = element.querySelector('.card-glow');
    if (glow) {
      glow.style.opacity = '0.15';
    }
  }

  removeHoverGlow(element) {
    const glow = element.querySelector('.card-glow');
    if (glow) {
      glow.style.opacity = '0';
    }
    
    // Reset tilt
    element.style.transform = '';
  }

  addParallaxEffect(element) {
    const children = element.querySelectorAll('.sensor-icon, .info-icon, .sensor-value');
    children.forEach(child => {
      child.style.transition = 'transform 0.3s ease';
    });
  }

  removeParallaxEffect(element) {
    const children = element.querySelectorAll('.sensor-icon, .info-icon, .sensor-value');
    children.forEach(child => {
      child.style.transform = '';
    });
  }
  updateCardTilt(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);
    
    const tiltX = deltaY * 8;
    const tiltY = deltaX * -8;
    
    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(20px)`;
    
    // Parallax effect on child elements
    const children = card.querySelectorAll('.sensor-icon, .info-icon, .sensor-value');
    children.forEach((child, index) => {
      const depth = (index + 1) * 5;
      child.style.transform = `translateZ(${depth}px) translateX(${deltaX * 3}px) translateY(${deltaY * 3}px)`;
    });
  }

  addButtonHoverEffects() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-3px) scale(1.05)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = '';
      });
      
      button.addEventListener('mousedown', () => {
        button.style.transform = 'translateY(-1px) scale(1.02)';
      });
      
      button.addEventListener('mouseup', () => {
        button.style.transform = 'translateY(-3px) scale(1.05)';
      });
    });
  }

  addIconAnimations() {
    const icons = document.querySelectorAll('.sensor-icon, .info-icon');
    
    icons.forEach(icon => {
      icon.addEventListener('mouseenter', () => {
        icon.style.transform = 'scale(1.2) rotate(10deg)';
      });
      
      icon.addEventListener('mouseleave', () => {
        icon.style.transform = '';
      });
    });
  }

  addMagneticEffects() {
    const magneticElements = document.querySelectorAll('.btn-primary, .btn-success, .btn-danger');
    
    magneticElements.forEach(element => {
      element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = (e.clientX - centerX) * 0.1;
        const deltaY = (e.clientY - centerY) * 0.1;
        
        element.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;
      });
      
      element.addEventListener('mouseleave', () => {
        element.style.transform = '';
      });
    });
  }
}

// Enhanced progress animations with spring physics
// Progress animations
class ProgressAnimations {
  constructor() {
    this.springConfig = { tension: 120, friction: 14 };
    this.init();
  }

  init() {
    this.animateProgressRings();
    this.animateProgressBars();
    this.animateCounters();
  }

  animateProgressRings() {
    const rings = document.querySelectorAll('.progress-ring-fill');
    
    rings.forEach(ring => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateRing(ring);
          }
        });
      });
      
      observer.observe(ring);
    });
  }

  animateRing(ring) {
    const circumference = 220;
    ring.style.strokeDashoffset = circumference;
    
    setTimeout(() => {
      ring.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      const targetOffset = ring.style.strokeDashoffset || circumference;
      ring.style.strokeDashoffset = targetOffset;
    }, 100);
  }

  animateProgressBars() {
    const bars = document.querySelectorAll('.gauge-fill, .confidence-fill, .aqi-fill');
    
    bars.forEach(bar => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateBar(bar);
          }
        });
      });
      
      observer.observe(bar);
    });
  }

  animateBar(bar) {
    const targetWidth = bar.style.width || '0%';
    bar.style.width = '0%';
    
    setTimeout(() => {
      bar.style.transition = 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      bar.style.width = targetWidth;
    }, 200);
  }

  animateCounters() {
    const counters = document.querySelectorAll('.sensor-value');
    
    counters.forEach(counter => {
    });
  }
}

// Water flow animation
class WaterFlowAnimation {
  constructor() {
    this.init();
  }

  init() {
    this.createFlowParticles();
  }

  createFlowParticles() {
    const flowContainers = document.querySelectorAll('.flow-animation');
    
    flowContainers.forEach(container => {
      this.animateFlow(container);
    });
  }

  animateFlow(container) {
    const particles = container.querySelector('.flow-particles');
    if (!particles) return;
    
    // Create multiple flowing particles
    for (let i = 0; i < 3; i++) {
      const particle = document.createElement('div');
      particle.className = 'flow-particle';
      particle.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background: var(--primary-color);
        border-radius: 50%;
        top: 50%;
        left: -10px;
        transform: translateY(-50%);
        animation: flow 1.5s infinite linear;
        animation-delay: ${i * 1}s;
        opacity: 0.7;
      `;
      
      particles.appendChild(particle);
    }
  }
}

// Notification animations
class NotificationAnimations {
  constructor() {
    this.init();
  }

  init() {
    this.observeNotifications();
  }

  observeNotifications() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const notification = mutation.target;
          if (notification.classList.contains('notification')) {
            this.animateNotification(notification);
          }
        }
      });
    });

    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(notification => {
      observer.observe(notification, { attributes: true });
    });
  }

  animateNotification(notification) {
    if (notification.style.display === 'flex') {
      notification.style.animation = 'slideInRight 0.2s ease-out';
    }
  }
}

// Loading animations
class LoadingAnimations {
  constructor() {
    this.init();
  }

  init() {
    this.createLoadingSpinners();
    this.animateSkeletonLoaders();
  }

  createLoadingSpinners() {
    const loadingElements = document.querySelectorAll('[data-loading]');
    
    loadingElements.forEach(element => {
      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      spinner.innerHTML = '<div class="spinner-ring"></div>';
      element.appendChild(spinner);
    });
  }

  animateSkeletonLoaders() {
    const skeletons = document.querySelectorAll('.skeleton');
    
    skeletons.forEach(skeleton => {
      skeleton.style.background = `
        linear-gradient(90deg, 
          var(--gray-200) 25%, 
          var(--gray-100) 50%, 
          var(--gray-200) 75%
        )
      `;
      skeleton.style.backgroundSize = '200% 100%';
      skeleton.style.animation = 'skeleton-loading 0.8s infinite';
    });
  }
}

// Chart animations (placeholder for integration with charts.js)
class ChartAnimations {
  constructor() {
    this.init();
  }

  init() {
    this.animateChartElements();
  }

  animateChartElements() {
    const charts = document.querySelectorAll('canvas');
    
    charts.forEach(chart => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.triggerChartAnimation(chart);
          }
        });
      });
      
      observer.observe(chart);
    });
  }

  triggerChartAnimation(chart) {
    // This will be implemented when charts are added
    chart.style.opacity = '0';
    chart.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
      chart.style.transition = 'all 0.4s ease-out';
      chart.style.opacity = '1';
      chart.style.transform = 'scale(1)';
    }, 100);
  }
}

// Add CSS animations dynamically
function addAnimationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @keyframes flow {
      0% { left: -10px; opacity: 0; }
      10% { opacity: 0.7; }
      90% { opacity: 0.7; }
      100% { left: calc(100% + 10px); opacity: 0; }
    }

    .animate-on-scroll {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.3s ease-out;
    }

    .animate-on-scroll.animate-in {
      opacity: 1;
      transform: translateY(0);
    }

    .loading-spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10;
    }

    .spinner-ring {
      width: 24px;
      height: 24px;
      border: 3px solid var(--gray-200);
      border-top: 3px solid var(--primary-color);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .sensor-card, .status-card, .info-card {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sensor-card:hover, .status-card:hover, .info-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .btn {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sensor-icon, .info-icon {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .progress-ring-fill {
      transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .gauge-fill, .confidence-fill, .aqi-fill {
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .water-fill {
      transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .ph-indicator {
      transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .battery-level {
      transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .pump-animation.active {
      animation: pump-pulse 0.8s infinite ease-in-out;
    }

    @keyframes pump-pulse {
      0%, 100% { 
        transform: scale(1); 
        filter: drop-shadow(0 0 5px var(--primary-color));
      }
      50% { 
        transform: scale(1.1); 
        filter: drop-shadow(0 0 15px var(--primary-color));
      }
    }

    .thinking-dot {
      animation: thinking 0.8s infinite ease-in-out;
    }

    @keyframes thinking {
      0%, 80%, 100% { 
        transform: scale(0);
        opacity: 0.5;
      }
      40% { 
        transform: scale(1);
        opacity: 1;
      }
    }

    .alert-badge {
      animation: badge-pulse 1s infinite;
    }

    @keyframes badge-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .status-indicator.active::after {
      animation: status-pulse 1s infinite;
    }

    @keyframes status-pulse {
      0% { 
        transform: scale(1); 
        opacity: 0.3; 
      }
      50% { 
        transform: scale(1.3); 
        opacity: 0.1; 
      }
      100% { 
        transform: scale(1); 
        opacity: 0.3; 
      }
    }
  `;
  
  document.head.appendChild(style);
}

// Initialize all animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  addAnimationStyles();
  
  // Initialize animation systems
  new ParticleSystem();
  new ScrollAnimations();
  new HoverEffects();
  new ProgressAnimations();
  new WaterFlowAnimation();
  new NotificationAnimations();
  new LoadingAnimations();
  new ChartAnimations();
});

// Export for use in other modules
window.AnimationSystems = {
  ParticleSystem,
  ScrollAnimations,
  HoverEffects,
  ProgressAnimations,
  WaterFlowAnimation,
  NotificationAnimations,
  LoadingAnimations,
  ChartAnimations
};