import React from "react";
import { Link } from "react-router-dom";
import heroImage from "../../assets/images/home1.png";
import yogapose1 from "../../assets/images/yoga-pose 1.png";
import grouppic from "../../assets/images/Group 6.png";
import trackingimg from "../../assets/images/tracking img.png";
import service1 from "../../assets/images/service1.png";
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
      text: "Your AI coach adapts every pose to your unique body mechanics — no guesswork, no injuries, just perfect alignment."
    },
    {
      title: "Instant Posture Correction",
      text: "TheraTrack scans your movement and gives real-time posture feedback. Think of it as your personal physiotherapist inside your device."
    },
    {
      title: "Next-Level Progress Tracking",
      text: "Every rep, stretch, and movement is tracked with precision. Visual graphs, AI insights, and streaks keep you motivated like never before."
    },
    {
      title: "Personalized Plans",
      text: "Your AI learns from your body, energy levels, and goals. Workouts evolve automatically to push you harder when you’re ready and recover when you need it."
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <div className="p-background py-5">
        <div className="container">
          <section className="hero-section d-flex flex-column flex-md-row align-items-center justify-content-between">
            <div className="hero-text text-center text-md-start mb-4 mb-md-0 col-12 col-md-6">
              <h1 className="hero-title">Your Body. Your AI. Your Superpower.</h1>
              <p className="hero-subtitle">
                Step into the future of fitness and physiotherapy. TheraTrack’s AI doesn’t just guide you — it learns your body, anticipates your movements, and adapts workouts in real-time.
              </p>
              {isAuthenticated ? (
                <>
                  <Link to="/api/exercises" className="btn btn-primary mx-1 my-1">Start Exercising</Link>
                  <Link to="/api/profile" className="btn btn-outline-primary mx-1 my-1">View Profile</Link>
                </>
              ) : (
                <>
                  <Link to="/api/login" className="btn btn-primary mx-1 my-1">Login</Link>
                  <Link to="/api/register" className="btn btn-outline-primary mx-1 my-1">Register Free</Link>
                </>
              )}
            </div>
            <div className="text-center hero-img">
              <img src={heroImage} className="img-fluid floating-image" alt="AI Fitness Coach" />
            </div>
          </section>
        </div>
      </div>

      {/* Cards Section */}
      <section className="cards-section py-5">
        <div className="container">
          <div className="row g-4 justify-content-center">
            {cards.map((card, idx) => (
              <div
                key={idx}
                className="col-12 col-sm-6 col-md-6 col-lg-3 d-flex justify-content-center"
              >
                <div className="card shadow-sm w-100 p-3 hover-lift">
                  <div className="d-flex flex-column flex-md-row align-items-center gap-3">
                    <img src={yogapose1} alt="Yoga Pose" className="card-img-side img-fluid" />
                    <div className="card-content text-center text-md-start">
                      <h5 className="card-title mb-2">{card.title}</h5>
                      <p className="card-text mb-0">{card.text}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Experience Section */}
      <section className="experience-section">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-12 col-md-6 text-center">
              <img src={grouppic} alt="group-picture" className="img-fluid rounded" />
            </div>
            <div className="col-12 col-md-6 text-center text-md-start">
              <span>AI That Moves With You</span>
              <h2 className="mt-2">Push Beyond Limits And Unlock Your Strength</h2>
              <p>Forget generic workouts. TheraTrack uses advanced AI to analyze your biomechanics, correct your posture instantly, and craft routines designed specifically for your body.</p>
              {isAuthenticated ? (
                <Link to="api/exercises" className="btn btn-primary my-2">Start Exercising</Link>
              ) : (
                <Link to="api/login" className="btn btn-primary my-2">Login</Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="aboutUs">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-12 col-md-6 text-center text-md-start">
              <span>About Us</span>
              <h2 className="mt-2">The Future of Physiotherapy & Fitness, Powered by AI</h2>
              <p>TheraTrack isn’t just an app. It’s a revolutionary AI system that transforms the way you move, stretch, and train. Safe, smart, and addictive — fitness will never feel the same again.</p>
              <Link to="api/login" className="btn btn-primary my-2">Read More</Link>
            </div>
            <div className="col-12 col-md-6 text-center">
              <img src={trackingimg} alt="tracking-picture" className="img-fluid rounded" />
            </div>
          </div>
        </div>
      </section>

      <section className="service-section">
        <div className="container text-center">
          <span>Our Service</span>
          <h2 className="mb-5">Empowering Your Fitness Journey with AI</h2>
          <div className="row ">
            <div className="col-12 col-md-4 mb-4 position-relative">
              <div className="service-card-wrapper">
                <div className="card align-items-center">
                  <img src={service1} alt="service1-picture" />
                </div>
                <div className="sub-card">
                  <span>AI COACH</span>
                  <h4>Personalized Yoga Sessions</h4>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4 mb-4 position-relative">
              <div className="service-card-wrapper">
                <div className="card align-items-center">
                  <img src={service1} alt="service1-picture" />
                </div>
                <div className="sub-card">
                  <span>TRACKING</span>
                  <h4>Real-Time Posture & Motion</h4>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4 mb-4 position-relative">
              <div className="service-card-wrapper">
                <div className="card align-items-center">
                  <img src={service1} alt="service1-picture" />
                </div>
                <div className="sub-card">
                  <span>INSIGHTS</span>
                  <h4>Track Progress & Results</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="photos-section">
        <div className="container-fluid p-0">
          <div className="photos-grid">
            <img src={image1} alt="image1" />
            <img src={image2} alt="image2" />
            <img src={image3} alt="image3" />
            <img src={image6} alt="image6" />
            <img src={image5} alt="image4" />
            <img src={image4} alt="image5" />
          </div>
        </div>
      </section>




    </>
  );
}

export default Home;
