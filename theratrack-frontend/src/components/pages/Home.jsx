import React from "react";
import { Link } from "react-router-dom";
import heroImage from "../../assets/images/home1.png";
import yogapose1 from "../../assets/images/yoga-pose 1.png";
import grouppic from "../../assets/images/Group 6.png";
import trackingimg from "../../assets/images/tracking img.png";
import service from "../../assets/images/service.png";
import image1 from "../../assets/images/image 1.png";
import image2 from "../../assets/images/image 2.png";
import image3 from "../../assets/images/image 3.png";
import image4 from "../../assets/images/image 4.png";
import image5 from "../../assets/images/image 5.png";
import image6 from "../../assets/images/image 6.png";
import "../css/Home.css";

function Home() {
  const isAuthenticated = localStorage.getItem("isLoggedIn") === "true";

  const cards = [
    {
      title: "AI Yoga Companion",
      text: "Your AI coach customises each posture to your specific body mechanics – no guesswork, no injuries, just perfect alignment."
    },
    {
      title: "Instant Posture Correction",
      text: "TheraTrack provides real-time posture feedback by scanning your movements. Consider your gadget to be your own personal physiotherapist."
    },
    {
      title: "Next-Level Progress Tracking",
      text: "With AI-powered insights, you can monitor your exercises, spot trends, and see your progress to help you accomplish your goals more quickly."
    },
    {
      title: "Personalized Plans",
      text: "TheraTrack creates flexible plans that change as you get better by learning from your body, energy levels, and objectives."
    }
  ];

  return (
    <>
      {/* HERO */}
      <section className="p-background">
        <div className="container">
          <div className="hero-section row align-items-center justify-content-between">
            <div className="col-md-6 hero-text">
              <h1 className="hero-title">Your Body. Your AI. Your Superpower.</h1>
              <p className="hero-subtitle">
                Step into the future of fitness and physiotherapy. TheraTrack's AI learns from your motions, adapts exercises in real time, and enables you to train smarter, safer, and more effectively than before.
              </p>

              <div className="d-flex align-items-center flex-wrap gap-2 hero-buttons">
                {isAuthenticated ? (
                  <Link to="/api/exercises" className="btn btn-primary">Start Exercising</Link>
                ) : (
                  <Link to="/api/login" className="btn btn-primary">Join Now</Link>
                )}

                <div className="hero-video">
                  <i className="fa-solid fa-play"></i>
                  <span>Watch Video</span>
                </div>
              </div>
            </div>

            <div className="col-md-6 text-center hero-img">
              <img src={heroImage} className="img-fluid floating-image" alt="AI Fitness Coach" />
            </div>
          </div>
        </div>
      </section>

      {/* CARDS */}
      <section className="cards-section">
        <div className="container">
          <div className="row g-4 justify-content-center">
            {cards.map((card, idx) => (
              <div key={idx} className="col-sm-6 col-lg-3">
                <div className="card h-100 p-3 hover-lift glass-card">
                  <div className="d-flex gap-3 align-items-center">
                    <img src={yogapose1} className="card-img-side" alt="Yoga" />
                    <div>
                      <h5>{card.title}</h5>
                      <p style={{ fontFamily: '"Poppins", sans-serif', fontSize: "13px", color: "#565555", fontWeight:"300" }}>
                        {card.text}
                      </p>


                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="experience-section">
        <div className="container">
          <div className="row align-items-center g-4 justify-content-center">
            <div className="col-md-6 text-center">
              <img src={grouppic} className="img-fluid rounded" alt="Group" />
            </div>
            <div className="col-md-6 auto-right">
              <span>AI That Moves With You</span>
              <h2>Push Beyond Limits And Unlock Your Strength</h2>
              <p>
                TheraTrack goes beyond generic workouts. Our AI analyzes your biomechanics in real-time, corrects posture instantly, and crafts routines tailored to your body, so every session is safe, effective, and optimized for growth.
              </p>

              {isAuthenticated ? (
                <Link to="/api/exercises" className="btn btn-primary">Start Exercising</Link>
              ) : (
                <Link to="/api/login" className="btn btn-primary">Join Now</Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="aboutUs">
        <div className="container">
          <div className="row align-items-center g-4 justify-content-between">
            <div className="col-md-6 auto-left">
              <span>About Us</span>
              <h2>The Future of Physiotherapy & Fitness, Powered by AI</h2>
              <p>
                TheraTrack isn’t just another fitness app. It’s a smart AI system designed to understand your body, optimize your movements, and provide personalized coaching. Whether you’re recovering from injury or pushing your limits, TheraTrack guides you every step of the way.
              </p>
              <Link to="/api/about" className="btn btn-primary">Read More</Link>
            </div>
            <div className="col-md-6 text-center">
              <img src={trackingimg} className="img-fluid rounded" alt="Tracking" />
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE FLOAT */}
      <section className="service-section floating-from-about">
        <div className="container">
          <div className="service-board">
            <div className="service-item">
              <img src={service} alt="Service" className="service-img" />
              <div className="service-text">
                <span>10+</span>
                <p>AI-GUIDANCE</p>
              </div>
            </div>

            <div className="service-item">
              <img src={service} alt="Service" className="service-img" />
              <div className="service-text">
                <span>8+</span>
                <p>PERSONALIZED WORKOUTS</p>
              </div>
            </div>

            <div className="service-item">
              <img src={service} alt="Service" className="service-img" />
              <div className="service-text">
                <span>15+</span>
                <p>PROGRESS TRACKING</p>
              </div>
            </div>

            <div className="service-item">
              <img src={service} alt="Service" className="service-img" />
              <div className="service-text">
                <span>5+</span>
                <p>EXPERT SUPPORT</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* PHOTOS */}
      <section className="photos-section">
        <div className="photos-grid">
          <img src={image4} alt="Gallery 1" />
          <img src={image2} alt="Gallery 2" />
          <img src={image3} alt="Gallery 3" />
          <img src={image6} alt="Gallery 4" />
          <img src={image5} alt="Gallery 5" />
          <img src={image1} alt="Gallery 6" />
        </div>
      </section>
    </>
  );
}

export default Home;
