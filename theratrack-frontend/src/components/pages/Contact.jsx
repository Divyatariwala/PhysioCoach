import React from "react";
import "../css/Contact.css";
import 'bootstrap-icons/font/bootstrap-icons.css';

const Contact = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="hero-section contact-hero">
        <div className="container hero-text">
          <h1 className="hero-title">Get in Touch</h1>
          <p className="hero-subtitle">
            Have questions or need support? Send us a message and we’ll get back to you as soon as possible.
          </p>
        </div>
        <div className="hero-shape shape1"></div>
        <div className="hero-shape shape2"></div>
        <div className="hero-shape shape3"></div>
      </section>

      {/* Contact Form & Info */}
      <section className="section contact-section">
        <div className="container">
          <div className="row justify-content-center">
            {/* Form */}
            <div className="col-lg-6">
              <div className="glass-card hover-lift contact-form">
                <form>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label fw-bold">Name</label>
                    <input type="text" id="name" name="name" placeholder="Your Name" required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-bold">Email</label>
                    <input type="email" id="email" name="email" placeholder="Your Email" required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="subject" className="form-label fw-bold">Subject</label>
                    <input type="text" id="subject" name="subject" placeholder="Subject" required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="message" className="form-label fw-bold">Message</label>
                    <textarea id="message" name="message" rows="5" placeholder="Type your message..." required></textarea>
                  </div>
                  <button type="submit" className="btn btn-cta w-100 fw-bold">Send Message</button>
                </form>
              </div>
            </div>

            {/* Contact Info */}
            <div className="col-lg-4 mt-5 mt-lg-0">
              <div className="glass-card hover-lift contact-info text-center p-4">
                <h4 className="fw-bold mb-4">Our Office</h4>
                <p><i className="bi bi-geo-alt-fill me-2"></i> London, UK</p>
                <p><i className="bi bi-telephone-fill me-2"></i> +44 1234 567890</p>
                <p><i className="bi bi-envelope-fill me-2"></i> support@physiocoach.com</p>
                <h5 className="fw-bold mt-4 mb-3">Follow Us</h5>
                <div className="d-flex justify-content-center gap-3">
                  <a href="#" className="contact-social"><i className="bi bi-facebook"></i></a>
                  <a href="#" className="contact-social"><i className="bi bi-twitter"></i></a>
                  <a href="#" className="contact-social"><i className="bi bi-instagram"></i></a>
                  <a href="#" className="contact-social"><i className="bi bi-linkedin"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
