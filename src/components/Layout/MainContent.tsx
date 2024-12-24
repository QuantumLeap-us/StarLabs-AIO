import './MainContent.css';

const MainContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="main-content">
      <div className="main-content-inner">
        {children}
      </div>
    </main>
  )
}

export default MainContent