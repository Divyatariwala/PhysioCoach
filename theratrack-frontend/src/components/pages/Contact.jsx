import React, { useState } from "react";
import picture from "../../assets/images/about&profile.png";
import { Link } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import styles from "../css/Contact.module.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  // ---------- Popups ----------
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success"); // "success" or "error"

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ---------- Email Validation ----------
  const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ---------- Check required fields ----------
    if (!formData.name || !formData.email || !formData.message) {
      showPopupMessage("❌ All fields are required!", "error");
      return;
    }

    // ---------- Check email format ----------
    if (!isValidEmail(formData.email)) {
      showPopupMessage("❌ Invalid email format!", "error");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/contact/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showPopupMessage("✅ Message submitted successfully!", "success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        showPopupMessage("❌ Failed to submit message.", "error");
      }
    } catch (err) {
      console.error(err);
      showPopupMessage("❌ Server error. Please try again later.", "error");
    }
  };

  const showPopupMessage = (message, type) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 4000); // hide after 4s
  };

  return (
    <>
      {/* Banner Section */}
      <section className={styles.contactSection}>
        <div className="container-fluid p-0 position-relative">
          <div className={styles.imageOverlay}></div>
          <img src={picture} alt="TheraTrack contact" className={styles.contactImage} />
          <div className={styles.contactContent}>
            <h1>Contact Us</h1>
            <p>
              <Link to="/" className={styles.breadcrumbLink}>Home</Link> / <span>Contact Us</span>
            </p>
          </div>
        </div>
      </section>

      {/* Contact Details */}
      <section className={styles.contactDetails}>
        <div className="container">
          <div className="row">

            {/* Left Side */}
            <div className="col-md-6">
              <div className="address">
                <h3>Our Office</h3>
                <p>TheraTrack is committed to helping you achieve your fitness goals.</p>
                <p>Reach out to us for support, feedback, or any questions.</p>
                <p>Our team is always ready to assist you in your health journey.</p>
              </div>

              <h3 className="pt-4">Branch</h3>
              <div className={styles.address}>
                <p>115 New Cavendish St</p>
                <p>London W1W 6UW</p>
                <p className="pt-2">Email: <a href="mailto:noreply.theratrack@gmail.com">noreply.theratrack@gmail.com</a></p>
                <p>Phone: 020 7911 5000</p>
              </div>
            </div>

            {/* Right Side - Contact Form */}
            <div className={`col-md-6 ${styles.paddingUp}`}>
              <div className="d-flex justify-content-center">
                {/* Popup Notification */}
                {showPopup && (
                  <div className={`${styles.contactPopup} ${popupType === "success" ? styles.popupSuccess : styles.popupError}`}>
                    {popupMessage}
                  </div>
                )}
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group pb-3">
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="Name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group pb-3">
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => {
                      if (formData.email && !isValidEmail(formData.email)) {
                        showPopupMessage("❌ Invalid email format!", "error");
                      }
                    }}
                  />
                </div>

                <div className="form-group">
                  <textarea
                    name="message"
                    className="form-control"
                    rows="5"
                    placeholder="Message"
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary mt-3">
                  Submit
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* Join Now Section */}
      <section className={styles.joinSection}>
        <div className="container d-flex flex-column flex-md-row align-items-center justify-content-center py-4">
          <h3 className="text-center text-md-start mb-3 mb-md-0 me-md-4">
            Ready to take the first step towards your fitness goals?
          </h3>
          <Link to="/signup" className="btn btn-primary">Join Now</Link>
        </div>
      </section>
    </>
  );
};

export default Contact;







// only logo, exercise, privacy policy page left 
// hover , focus colours


