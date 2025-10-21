import React from "react";
import { Link } from "react-router-dom";
import heroImage from "../../assets/images/hero-fitness.png"; // Adjust path
import feature1 from "../../assets/images/feature1.png";
import feature2 from "../../assets/images/feature2.png";
import feature3 from "../../assets/images/feature3.png";
import "../css/Home.css";

function Home({ isAuthenticated }) {
  return (
    <>
      {/* Hero Section */}
      <section className="hero-section d-flex align-items-center py-5 position-relative overflow-hidden">
        <svg className="hero-shape shape1" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="100" fill="#ffde59" opacity="0.3" />
        </svg>
        <svg className="hero-shape shape2" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="100" fill="#52b788" opacity="0.25" />
        </svg>
        <svg className="hero-shape shape3" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="100" fill="#1b4332" opacity="0.2" />
        </svg>

        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start hero-text">
              <h1 className="display-4 fw-bold mb-3 hero-title">Move Better, Feel Better</h1>
              <p className="lead mb-4 hero-subtitle">
                AI-powered physiotherapy guidance to track exercises, correct posture, and build a healthy lifestyle.
              </p>

              {isAuthenticated ? (
                <>
                  <Link to="/exercises" className="btn btn-primary mx-2">Start Exercising</Link>
                  <Link to="/profile" className="btn btn-outline-primary mx-2">View Profile</Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-primary mx-2">Login</Link>
                  <Link to="/register" className="btn btn-outline-primary mx-2">Register Free</Link>
                </>
              )}
            </div>

            <div className="col-md-6 text-center">
              <img src={heroImage} className="img-fluid hero-image floating-image" alt="AI Fitness Coach" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-5" style={{ background: "#f0f7f0" }}>
        <div className="container text-center">
          <h2 className="fw-bold mb-5">Why PhysioCoach?</h2>
          <div className="row g-4">
            {[
              { icon: "bi bi-check-circle-fill", title: "Track Progress", text: "Monitor your exercises, reps, and posture improvements over time." },
              { icon: "bi bi-person-badge-fill", title: "AI Posture Coach", text: "Receive real-time posture feedback to prevent injuries." },
              { icon: "bi bi-lightning-fill", title: "Personalized Workouts", text: "Exercises tailored to your goals, level, and body type." },
            ].map((benefit, idx) => (
              <div className="col-md-4" key={idx}>
                <div className="glass-card p-4 benefit-card hover-lift">
                  <i className={`${benefit.icon} fs-1 text-success mb-3`}></i>
                  <h5 className="fw-bold mb-2">{benefit.title}</h5>
                  <p>{benefit.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center fw-bold mb-5">AI Coach Features</h2>
          {[
            { img: feature1, title: "Smart Exercise Tracker", text: "Track every rep automatically and receive AI-guided suggestions to improve form.", reverse: false },
            { img: feature2, title: "Posture Correction", text: "Real-time feedback ensures your posture is correct during exercises to prevent injuries.", reverse: true },
            { img: feature3, title: "Personalized Guidance", text: "Customized exercise routines and tips that adapt as you progress.", reverse: false },
          ].map((feature, idx) => (
            <div
              className={`row align-items-center mb-5 hover-lift ${feature.reverse ? "flex-md-row-reverse" : ""}`}
              key={idx}
            >
              <div className="col-md-6">
                <img src={feature.img} className="img-fluid feature-img floating-image" alt={feature.title} />
              </div>
              <div className="col-md-6">
                <div className="glass-card p-4 feature-desc hover-lift">
                  <h5 className="fw-bold mb-3">{feature.title}</h5>
                  <p>{feature.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default Home;
