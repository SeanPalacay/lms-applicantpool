import React from 'react';
import { Link } from 'react-router-dom';
import './styles/footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Logo and Copyright */}
        <div className="footer-top">
          <Link to="/" className="footer-logo">JMH <span className="sub-logo">LMS</span></Link>
          <p className="copyright">
            &copy; {new Date().getFullYear()} JMH Microfinance Inc. All rights reserved.
          </p>
        </div>

        {/* Links and Version */}
        <div className="footer-bottom">
          <div className="footer-links">
            <Link to="/help">Help Center</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
          <div className="footer-version">Version 1.0.0</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
