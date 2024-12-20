import { Link } from 'react-router-dom'
import { ReactElement } from 'react'

interface MenuItemProps {
  title: string;
  icon: ReactElement;
  path: string;
}

const MenuItem = ({ title, icon, path }: MenuItemProps) => {
  return (
    <Link to={path} className="menu-item">
      <span className="menu-icon">{icon}</span>
      <span className="menu-title">{title}</span>
    </Link>
  )
}

export default MenuItem 