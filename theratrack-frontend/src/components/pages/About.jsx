import React, { useEffect, useState } from "react";
import picture from "../../assets/images/about&profile.png";
import grouppic from "../../assets/images/Group 7.png";
import heartIcon from "../../assets/images/heartIcon.png";
import styles from "../css/About.module.css";
import { Link, useOutletContext } from "react-router-dom";

const About = () => {
  const { isLoggedIn } = useOutletContext();
  const coreValues = [
    { title: "Passion", text: "We are passionate about fitness and technology, combining both to inspire every user to move, improve, and succeed." },
    { title: "Integrity", text: "We prioritize honesty, transparency, and trust in every aspect of our platform and interactions." },
    { title: "Innovation", text: "We continuously innovate, leveraging AI to create cutting-edge, personalized workout experiences." },
    { title: "Community", text: "We foster a supportive and inclusive environment where every member can thrive and achieve their goals." }
  ];

  return (
    <>
      {/* About Section */}
      <section className={styles.aboutSection}>
        <div className="container-fluid p-0 position-relative">
          <div className={styles.imageOverlay}></div>
          <img src={picture} alt="TheraTrack about" className={styles.aboutImage} />
          <div className={styles.aboutContent}>
            <h1>About us</h1>
            <p><Link to="/" className={styles.breadcrumbLink}>Home</Link> / <span>About</span></p>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="experience-section">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-12 col-md-6 text-center">
              <img src={grouppic} alt="TheraTrack team training" className="img-fluid rounded" />
            </div>
            <div className={`col-12 col-md-6 text-center text-md-start mt-3 mt-md-0 ${styles.textColumn}`}>
              <span>AI That Moves With You</span>
              <h2 className="mt-2">Transform Your Fitness Journey with Precision AI</h2>
              <p>Say goodbye to one-size-fits-all workouts. TheraTrack uses cutting-edge AI to comprehend your particular body mechanics, offer immediate posture corrections, and create exercises that are especially suited to your objectives and strengths. TheraTrack adjusts to your goals, whether they be mobility, strength, or general well-being.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className={styles.missionSection}>
        <h1>Our Mission & Vision</h1>
        <div className={styles.missionCards}>
          <div className={styles.card}>
            <h3>Our Mission</h3>
            <p>To empower individuals to reach their full potential by combining AI technology with expert guidance, creating personalized fitness experiences that are safe, effective, and motivating.</p>
          </div>
          <div className={styles.card}>
            <h3>Our Vision</h3>
            <p>To revolutionize the way people train, making AI-assisted fitness accessible to everyone and fostering a global community that embraces health, strength, and well-being.</p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className={styles.coreValuesSection}>
        <h1>Our Core Values</h1>
        <div className={styles.valuesGrid}>
          {coreValues.map((val, idx) => (
            <div key={idx} className={styles.valueCard}>
              <img src={heartIcon} alt={val.title} />
              <h4>{val.title}</h4>
              <p>{val.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Join Now */}
      {!isLoggedIn && (
        <section className={styles.joinSection}>
          <div className="container d-flex flex-column flex-md-row align-items-center justify-content-center py-4">
            <h3 className="text-center text-md-start mb-3 mb-md-0 me-md-4">
              Ready to take the first step towards your fitness goals?
            </h3>
            <Link to="/api/login" className="btn btn-primary">Join Now</Link>
          </div>
        </section>
      )}
    </>
  );
};

export default About;
