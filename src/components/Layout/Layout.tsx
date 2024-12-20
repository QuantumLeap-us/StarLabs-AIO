import Sidebar from './Sidebar'
import MainContent from './MainContent'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="layout">
      <Sidebar />
      <MainContent>{children}</MainContent>
    </div>
  )
}

export default Layout 