import React, { useEffect, useState } from "react";
import "../css/About.css";
import { Link } from "react-router-dom";

const About = ({ user }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
   // Check login status from localStorage
    useEffect(() => {
      const token = localStorage.getItem("isLoggedIn");
      if (token === "true") setIsLoggedIn(true);
    }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section about-hero">
        <div className="container hero-text">
          <h1 className="hero-title">About PhysioCoach</h1>
          <p className="hero-subtitle">
            Smart AI physiotherapy for posture, exercise tracking, and fitness improvement.
          </p>
          <Link to="/exercises" className="btn btn-cta mt-3">
            Start Exercising
          </Link>
        </div>
        <div className="hero-shape shape1"></div>
        <div className="hero-shape shape2"></div>
        <div className="hero-shape shape3"></div>
      </section>

      {/* Mission + Features */}
      <section className="section section-angle features-section">
        <div className="container text-center">
          <h2 className="section-title">Our Mission</h2>
          <p className="section-subtitle">
            Making physiotherapy accessible and engaging using AI-powered posture correction and exercise tracking.
          </p>
          <div className="features-grid">
            <div className="glass-card hover-lift feature-card">
              <img src="/images/ai.png" alt="AI Feedback" className="feature-img" />
              <h5>Smart AI Feedback</h5>
              <p>Instant posture correction during exercises to prevent injuries.</p>
            </div>
            <div className="glass-card hover-lift feature-card">
              <img src="/images/tracking.png" alt="Tracking" className="feature-img" />
              <h5>Progress Tracking</h5>
              <p>Visual dashboards track your improvements over time.</p>
            </div>
            <div className="glass-card hover-lift feature-card">
              <img src="/images/guidance.png" alt="Guidance" className="feature-img" />
              <h5>Personalized Guidance</h5>
              <p>Custom exercise plans adapted to your goals and fitness level.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section team-section">
        <div className="container text-center">
          <h2 className="section-title">Meet the Team</h2>
          <div className="team-grid">
            <div className="glass-card hover-lift team-card">
              <img src="/images/team1.jpg" alt="Divya" className="team-img" />
              <h5>Divya</h5>
              <p>Founder & Lead Developer</p>
            </div>
            <div className="glass-card hover-lift team-card">
              <img src="/images/team2.jpg" alt="Alex" className="team-img" />
              <h5>Alex</h5>
              <p>AI Specialist</p>
            </div>
            <div className="glass-card hover-lift team-card">
              <img src="/images/team3.jpg" alt="Priya" className="team-img" />
              <h5>Priya</h5>
              <p>UX Designer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline / Our Journey */}
      <section className="section section-angle-reverse journey-section">
        <div className="container text-center">
          <h2 className="section-title">Our Journey</h2>
          <div className="timeline">
            <div className="timeline-item">
              <h5>2023 - Concept</h5>
              <p>Idea born to create AI-powered physiotherapy accessible for everyone.</p>
            </div>
            <div className="timeline-item">
              <h5>2024 - Development</h5>
              <p>Platform built with real-time posture correction and personalized exercise tracking.</p>
            </div>
            <div className="timeline-item">
              <h5>2025 - Launch</h5>
              <p>PhysioCoach launched, helping users improve fitness and posture safely worldwide.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section cta-section-modern">
        <div className="container text-center">
          <h3 className="cta-title">Ready to Improve Your Fitness and Posture?</h3>
          {isLoggedIn ? (
            <>
              <Link to="/exercises" className="btn btn-cta mx-2">Start Exercising</Link>
              <Link to="/profile" className="btn btn-cta-outline mx-2">View Profile</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-cta mx-2">Login Now</Link>
              <Link to="/register" className="btn btn-cta-outline mx-2">Register Free</Link>
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default About;
