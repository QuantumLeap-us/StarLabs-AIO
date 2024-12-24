import Sidebar from './Sidebar'
import MainContent from './MainContent'
import './Layout.css'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <MainContent>{children}</MainContent>
      </div>
    </div>
  )
}

export default Layout