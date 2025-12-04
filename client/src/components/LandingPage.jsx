import { useState, useEffect } from "react";
import { Play, ChevronDown } from "lucide-react";

export default function LandingPage({ onPlayNow }) {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate opacity for video section based on scroll
  const videoOpacity = Math.max(0, 1 - scrollY / 600);

  return (
    <div className="landing-page">
      {/* ============================================
          HERO SECTION - Full screen with video bg
          ============================================ */}
      <section className="landing-hero">
        {/* Video Background */}
        <div className="landing-video-container">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="landing-video"
            >
            <source src="/videos/gameplay.webm" type="video/webm" />
          </video>
        </div>

        {/* Gradient Overlay */}
        <div className="landing-gradient-overlay" />

        {/* Hero Content */}
        <div 
          className="landing-hero-content"
          style={{ opacity: videoOpacity, transform: `translateY(${scrollY * 0.3}px)` }}
        >
          {/* Logo */}
          <div className={`landing-logo ${isLoaded ? 'landing-logo--visible' : ''}`}>
            <span className="landing-logo-text">BLOCK</span>
            <span className="landing-logo-text landing-logo-text--accent">QUEST</span>
          </div>

          {/* Tagline */}
          <p className={`landing-tagline ${isLoaded ? 'landing-tagline--visible' : ''}`}>
            Build worlds. Defy gravity. Own your creations as NFTs.
          </p>

          {/* CTA Button */}
          <button
            className={`landing-cta ${isLoaded ? 'landing-cta--visible' : ''}`}
            onClick={onPlayNow}
          >
            <Play size={20} />
            <span>PLAY NOW</span>
          </button>

          {/* Scroll Indicator - positioned below button */}
          <div className={`landing-scroll-indicator ${isLoaded ? 'landing-scroll-indicator--visible' : ''}`}>
            <span>DISCOVER THE LORE</span>
            <ChevronDown className="landing-scroll-arrow" />
          </div>
        </div>
      </section>

      {/* ============================================
          LORE SECTION - Starts on video, continues below
          ============================================ */}
      <section className="landing-lore">
        <div className="landing-lore-content">
          <h2 className="landing-lore-title">THE LEGEND</h2>
          
          <div className="landing-lore-text">
            <p>
              In the depths of the digital cosmos, there exists a realm where reality bends 
              to the will of its creators. The Block Quest dimension was discovered by the 
              first Architects—pioneers who learned to harness the power of quantum blocks 
              to build impossible structures. Here, gravity is merely a suggestion, and the 
              laws of physics bow to imagination. Each room is a canvas, each block a brushstroke 
              in an ever-expanding masterpiece that spans infinite cubic space.
            </p>
            
            <p>
              Now, a new generation of Architects has emerged. Armed with the ancient knowledge 
              of block manipulation and the modern magic of blockchain technology, they stake 
              their claim on rooms across the dimension. Every structure built, every gravity-defying 
              creation, becomes an eternal testament to their vision—permanently inscribed on the 
              chain. The question remains: What will you build? What impossible dreams will you 
              make real in the Block Quest dimension? The blocks await. The rooms are endless. 
              Your legend begins now.
            </p>
          </div>

          {/* Secondary CTA */}
          <button
            className="landing-cta landing-cta--secondary"
            onClick={onPlayNow}
          >
            <Play size={18} />
            <span>BEGIN YOUR JOURNEY</span>
          </button>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="landing-footer-logo">
            <span className="landing-footer-logo-text">BLOCK</span>
            <span className="landing-footer-logo-text landing-footer-logo-text--accent">QUEST</span>
          </div>

          <div className="landing-footer-links">
            <a href="#" className="landing-footer-link">Discord</a>
            <a href="#" className="landing-footer-link">Twitter</a>
            <a href="#" className="landing-footer-link">About</a>
          </div>
          
          <p className="landing-footer-copyright">
            © 2024 Block Quest. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
