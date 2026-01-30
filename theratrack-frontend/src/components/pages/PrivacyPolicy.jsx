import { Link } from "react-router-dom";
import picture from "../../assets/images/about&profile.png";
import { useState } from "react";
import styles from "../css/PrivacyPolicy.module.css";

const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState("introduction");

  const sections = [
    {
      id: "introduction", title: "Introduction", content: (
        <>
          <p>This Privacy and Data Protection Policy describes how TheraTrack gathers, handles, and protects participant and personal data in accordance with the UK Data Protection Act 2018, GDPR 2018, and the University of Westminster's ethical principles.</p>
          <p>AI-driven posture recognition for enhancing exercise performance, tracking physical activity, and encouraging safe workout practices is the focus of the academic research project TheraTrack. Participants may provide personal data and participate in activity tracking as part of the study, which aids in our analysis of exercise motions and posture accuracy.</p>
          <p>This policy describes participant rights about personal data as well as how it is gathered, used, kept, and safeguarded. Ensuring openness, upholding confidentiality, and safeguarding the privacy of all users or participants in TheraTrack are our objectives.</p>
        </>
      )
    },
    {
      id: "purpose", title: "Purpose of Data Collection", content: (
        <>
          <p>The information gathered by TheraTrack is only utilised to further the objectives of this scholarly investigation and to improve the experience of participants. In particular, the goals consist of:</p>
          <p><span>Exercise Performance Analysis:</span> This allows AI algorithms to deliver precise feedback on repetition quality and posture by monitoring participant movements and posture during exercises.</p>
          <p><span>Safety monitoring:</span> To spot potentially dangerous or improper exercise motions and assist in ensuring that participants carry out exercises in a safe manner.</p>
          <p><span>Research and Development:</span> To better understand exercise performance patterns and enhance the AI posture detection algorithm by analysing aggregated data.</p>
          <p><span>Participant Feedback:</span> To give participants individualised feedback on their workouts, including descriptions of their sessions, posture accuracy, and repeat counts.</p>
          <p><span>Compliance and Reporting:</span> To keep records in compliance with academic research regulations and ethical norms, without needlessly revealing personal names.</p>
          <p>The University of Westminster's ethical guidelines and the UK GDPR are strictly adhered to in the responsible and safe handling of all obtained data.</p>
        </>
      )
    },
    {
      id: "data-collected", title: "Data Collected", content: (
        <>
          <p>The following kinds of information may be gathered from participants when using TheraTrack:</p>
          <span>Personal Information:</span>
          <p>Name, email address, and contact information (if supplied) just for communication and research participation.</p>
          <span>Exercise and Activity Data:</span>
          <p>Pose keypoints or video recordings made during workouts are used to assess posture and movement precision.<br></br>
            The AI system generates posture scores, repetition counts, and session duration.</p>
          <span>Device and Technical Data:</span>
          <p>Device type, browser details, and technical performance statistics (such as frame rates and sensor readings) to guarantee the system operates as intended.</p>
          <p>Anonymised and combined data for reporting, research analysis, and enhancing AI posture detection algorithms.</p>
          <span>Aggregated Research Data: </span>
          <p>All information gathered will only be used for academic and research reasons; it will not be disclosed to outside parties, unless it is anonymised for publication or research.</p>
        </>
      )
    },
    {
      id: "cookies", title: "Cookies and Sessions Data", content: (
        <>
          <p>Cookies and session data may be used by TheraTrack to enhance platform performance and functionality. This comprises:</p>
          <span>Session Management:</span>
          <p>While users engage with the system, cookies and transient session data help sustain user sessions, guaranteeing a seamless exercise tracking experience.</p>
          <span>Performance Monitoring:</span>
          <p>To assist the system function better, non-personal technical data like page load speeds, video streaming performance, or AI processing times may be temporarily saved.</p>
          <span>No Tracking for Marketing:</span>
          <p>Cookies and session data are not used by TheraTrack for third-party marketing or advertising. The only purpose of all session and cookie data is to improve user experience and the calibre of research.</p>
          <span>Aggregated Research Data:</span>
          <p>Participants may choose to disable cookies in their browser; however, some features of TheraTrack, such as real-time exercise tracking and session feedback, may not function properly if cookies are disabled.</p>
        </>
      )
    },
    {
      id: "children", title: "Children's Data", content: (
        <>
          <p>Adults and participants who are at least 18 years old are the target audience for TheraTrack. We don't intentionally gather personal information from minors younger than 18.</p>
          <p>We will take urgent action to remove any personal information we may have unintentionally obtained from a youngster.</p>
          <p>It is recommended that parents or guardians get in touch with the project team if they think their child has given information to TheraTrack so that it can be deleted.</p>
          <p>We are dedicated to protecting children's privacy and adhering to all relevant data protection regulations pertaining to minors.</p>
        </>
      )
    },
    {
      id: "storage", title: "Data Storage & Security", content: (
        <>
          <p>Participant data security is a top priority for TheraTrack. Every piece of information gathered is processed and stored to prevent unauthorised access, disclosure, alteration, and destruction.</p>
          <span>Key measures include:</span><br></br>
          <p className="mt-1">
            <span className={styles.regularText}>Secure Storage: </span>
            Secure servers with limited access are used to store personal and session data.
          </p>

          <p>
            <span className={styles.regularText}>Encryption: </span>
            To preserve privacy, sensitive data, such as information from workout sessions, may be encrypted.
          </p>

          <p>
            <span className={styles.regularText}>Access Control: </span>
            The data required for the study is only accessible to researchers and authorised project participants.
          </p>

          <p>
            <span className={styles.regularText}>Retention Period: </span>
            According to University of Westminster ethical norms, data is only kept for as long as it takes to finish the academic research project. Personal information will be safely erased or anonymised after this time.
          </p>
        </>
      )
    },
    {
      id: "rights", title: "Participant Rights", content: (
        <>
          <p>Participants have the following rights with regard to their data under the UK Data Protection Act 2018 and GDPR:</p>
          <span>Right to Access:</span>
          <p>Participants may ask to see the personal information that TheraTrack has acquired about them.</p>
          <span>Right to Rectification:</span>
          <p>Participants may ask for any incomplete or erroneous data to be corrected.</p>
          <span>Right to Erasure:</span>
          <p>Participants have the option to have their personal information removed from the system.</p>
          <span>Right to Restrict Processing:</span>
          <p>Participants may ask that certain uses of their data be prohibited.</p>
          <span>Right to Object:</span>
          <p>When appropriate, participants may object to how their data is processed.</p>
          <p>The right to data portability allows participants to ask for a machine-readable copy of their data.</p>
        </>
      )
    },
    {
      id: "sharing", title: "Data Sharing & Confidentiality", content: (
        <>
          <p>TheraTrack takes precautions to guarantee that personal information is not disclosed to unapproved third parties and protects participant confidentiality.</p>
          <span>Internal Use Only: </span>
          <p>Only authorized researchers or project participants who are directly participating in the study have access to the data.</p>
          <span>Anonymous Data for Research:</span>
          <p>To avoid participant identification, all data supplied outside of the project, such as for scholarly publications or presentations, will be completely anonymous.</p>
          <span>Legal Requirements:</span>
          <p>Personal information may only be shared where mandated by law, regulation, or participant safety.</p>
        </>
      )
    },
    {
      id: "contact", title: "Contact Information", content: (
        <>
          <p>TheraTrack project team at: if you have any concerns about this privacy statement, want to access your data, or want to exercise any of your rights.</p>
          <p className="m-0">
            <span>Email address: </span>
            <a href="mailto:noreply.theratrack@gmail.com"></a>noreply.theratrack@gmail.com
          </p>
          <p className="m-0">
            <span>Project Lead: </span>
            Divya Tariwala
          </p>
          <p>
            <span>Address: </span>
            115 New Cavendish St, London W1W 6UW<br></br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;University of Westminster, London, UK
          </p>
          <p>We are dedicated to answering all questions in a timely manner while adhering to the GDPR and the UK Data Protection Act of 2018.</p>
        </>
      )
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section>
        <div className="container-fluid p-0 position-relative">
          <div className={styles.imageOverlay}></div>
          <img src={picture} alt="TheraTrack policy" className={styles.policyImage} />
          <div className={styles.policyContent}>
            <h1>Privacy Policy</h1>
            <p>
              <Link to="/" className={styles.breadcrumbLink}>Home</Link> / <span>Privacy Policy</span>
            </p>
          </div>
        </div>
      </section>

      {/* Policy Section */}
      <section>
        <div className="container">
          <div className={`${styles.policySection} row`}>

            {/* Left Column: Dynamic Policy Content */}
            <div className="col-md-8">
              <div className={styles.policyHead}>
                {sections.map((section) => (
                  activeSection === section.id && (
                    <div key={section.id}>
                      <h2>{section.title}</h2>
                      {section.content}
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Right Column: Table of Contents */}
            <div className="col-md-4">
              <div className={styles.tableContents}>
                <div className={styles.title}>Table of Contents:</div>
                <div className={styles.contentName}>
                  {sections.map((section) => (
                    <li
                      key={section.id}
                      className={activeSection === section.id ? styles.active : ""}
                      onClick={() => setActiveSection(section.id)}
                    >
                      {section.title}
                    </li>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

export default PrivacyPolicy;
