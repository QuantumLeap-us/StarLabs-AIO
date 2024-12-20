import React from 'react';
import { FaTelegram, FaGithub } from 'react-icons/fa';

const About = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <h1 className="about-title fancy-font">StarLabs</h1>
        
        <div className="about-links">
          <a 
            href="https://t.me/StarLabsTech" 
            target="_blank" 
            rel="noopener noreferrer"
            className="about-link"
          >
            <FaTelegram size={24} />
            <span className="link-text">Telegram Channel</span>
          </a>
          
          <a 
            href="https://github.com/starlabs-tech" 
            target="_blank" 
            rel="noopener noreferrer"
            className="about-link"
          >
            <FaGithub size={24} />
            <span className="link-text">GitHub</span>
          </a>
        </div>

        <div className="about-donation">
          <h3 className="donation-title fancy-font">Support Our Project</h3>
          <div className="donation-addresses">
            <div className="donation-address">
              <span className="chain-label">EVM:</span>
              <code>0x620ea8b01607efdf3c74994391f86523acf6f9e1</code>
            </div>
            <div className="donation-address">
              <span className="chain-label">SOL:</span>
              <code>6Jn5yG8238z8P1GkbyYo99WWLHr6C4m2pyiT1AKhEWwz</code>
            </div>
            <div className="donation-address">
              <span className="chain-label">TRX:</span>
              <code>TDZ9Gp7qS5vrgRhRdqYPCoH8ELLAtXJQgg</code>
            </div>
          </div>
        </div>

        <div className="about-description">
          <p>Welcome to StarLabs.</p>
          <p></p>

          <p>Automating user accounts, also known as standalone bots, is a violation of Terms of Service and Community Guidelines and will result in the termination of your account(s). Discretion is advised. I will not be held responsible for your actions. Read Terms of Service and Community Guidelines.</p>
          <p></p>
          <p>This software was written as a proof of concept that accounts can be automated and can perform actions beyond the normal users so that developers can make changes. The authors are released from any liability that your use may entail.</p>
        </div>
      </div>
    </div>
  );
};

export default About; 