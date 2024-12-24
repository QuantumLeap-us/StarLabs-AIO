import { BrowserRouter as Router, Routes, Route, createRoutesFromElements } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import About from './pages/About'
import Accounts from './pages/Accounts'
import Settings from './pages/Settings'
import { ProxyChecker } from './modules/proxy_checker'
import { WalletChecker } from './modules/wallet_checker'
import WalletGenerator from './pages/WalletGenerator'

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/proxy-checker" element={<ProxyChecker />} />
          <Route path="/wallet-checker" element={<WalletChecker />} />
          <Route path="/wallet-generator" element={<WalletGenerator />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
