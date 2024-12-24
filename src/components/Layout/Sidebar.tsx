import MenuItem from '../common/MenuItem'
import { Link } from 'react-router-dom'
import { FaTwitter, FaRobot, FaNetworkWired, FaWallet, FaInfoCircle, FaKey, FaExchangeAlt } from 'react-icons/fa'

const Sidebar = () => {
  const menuItems = [
    { title: 'Twitter', icon: <FaTwitter color="#1DA1F2" size={20} />, path: '/' },
    { title: 'Proxy Checker', icon: <FaNetworkWired color="#F1C40F" size={20} />, path: '/proxy-checker' },
    { title: 'Wallet Checker', icon: <FaWallet color="#E84393" size={20} />, path: '/wallet-checker' },
    { title: 'Wallet Generator', icon: <FaKey color="#4CAF50" size={20} />, path: '/wallet-generator' },
    { title: 'About', icon: <FaInfoCircle color="#FF9500" size={20} />, path: '/about' },
  ]

  return (
    <div className="sidebar">
      <Link 
        to="https://t.me/StarLabsTech" 
        className="logo-container" 
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="/logo.png" alt="StarLabs Logo" className="logo-image" />
        <span className="logo-text fancy-font">StarLabs</span>
      </Link>
      <nav className="menu">
        {menuItems.map((item) => (
          <MenuItem key={item.path} {...item} />
        ))}
      </nav>
    </div>
  )
}

export default Sidebar