import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">StarLabs AIO</Link>
      </div>
      <ul className="navbar-nav">
        <li className="nav-item">
          <Link to="/proxy-checker">Proxy Checker</Link>
        </li>
        <li className="nav-item">
          <Link to="/wallet-checker">Wallet Checker</Link>
        </li>
        <li className="nav-item">
          <Link to="/wallet-generator">Wallet Generator</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
