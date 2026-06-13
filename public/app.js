// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('show');
});

// Close mobile menu when clicking a link
document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('show');
    });
});

// Smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Scroll reveal for feature cards
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card').forEach(card => {
    observer.observe(card);
});

// FAQ accordion
document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    const toggle = item.querySelector('.faq-toggle');
    
    question.addEventListener('click', () => {
        const isOpen = answer.classList.contains('open');
        
        // Close all other FAQs
        document.querySelectorAll('.faq-answer').forEach(a => {
            if (a !== answer) {
                a.classList.remove('open');
                a.previousElementSibling.querySelector('.faq-toggle').classList.remove('active');
            }
        });
        
        // Toggle current
        answer.classList.toggle('open');
        toggle.classList.toggle('active');
    });
});

// Download button with toast notification
const downloadBtn = document.getElementById('downloadBtn');
const toast = document.getElementById('toast');

downloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Show toast
    toast.classList.add('show');
    
    // Simulate download (replace with actual APK URL)
    console.log('Download started - Replace with actual APK download link');
    
    // Hide toast after 2 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
    
    // Actual download would be:
    // window.location.href = '/path/to/app.apk';
});

// Parallax effect on phone mockup
document.addEventListener('mousemove', (e) => {
    const phone = document.querySelector('.phone-mockup');
    if (!phone) return;
    
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;
    
    const rotateX = (mouseY - 0.5) * 10;
    const rotateY = (mouseX - 0.5) * 10;
    
    phone.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});

// Reset transform on mouse leave
document.body.addEventListener('mouseleave', () => {
    const phone = document.querySelector('.phone-mockup');
    if (phone) {
        phone.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }
});

// Animate stats when they come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const numbers = entry.target.querySelectorAll('.stat-number');
            numbers.forEach(num => {
                const target = num.innerText;
                if (target !== 'Free') {
                    animateNumber(num, target);
                }
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

function animateNumber(element, target) {
    let current = 0;
    const increment = target === '60fps' ? 2 : 0.5;
    const max = target === '60fps' ? 60 : 4;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= max) {
            element.innerText = target;
            clearInterval(timer);
        } else {
            element.innerText = Math.floor(current) + (target === '60fps' ? 'fps' : '');
        }
    }, 30);
}

// Platform card click animation
document.querySelectorAll('.platform-card').forEach(card => {
    card.addEventListener('click', () => {
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = '';
        }, 200);
    });
});

// Feature card hover effect
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});

// Add loading animation for page
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Dynamic year in footer
const yearSpan = document.querySelector('.footer-copyright');
if (yearSpan) {
    yearSpan.innerHTML = `© ${new Date().getFullYear()} Stream Studio. All rights reserved.`;
}

// Prevent duplicate scroll animations
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(() => {
            const scrolled = window.scrollY;
            const hero = document.querySelector('.hero');
            if (hero) {
                hero.style.opacity = Math.max(1 - scrolled / 500, 0);
            }
            ticking = false;
        });
        ticking = true;
    }
});