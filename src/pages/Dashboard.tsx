import { useState } from 'react';
import FollowModule from '../components/modules/twitter/FollowModule/FollowModule';
import CommentModule from '../components/modules/twitter/CommentModule/CommentModule';
import RetweetModule from '../components/modules/twitter/RetweetModule/RetweetModule';
import TweetModule from '../components/modules/twitter/TweetModule/TweetModule';
import VoteModule from '../components/modules/twitter/VoteModule/Vote';
import ChangeProfile from '../components/modules/twitter/ChangeProfileModule/ChangeProfile';
import Settings from './Settings';
import Accounts from './Accounts';

import "./Dashboard.css";
import { FiUser, FiUserX, FiChevronDown, FiPlay, FiCommand, FiSettings, FiUsers } from "react-icons/fi";
import LikeModule from '../components/modules/twitter/LikeModule/LikeModule';

interface ActionConfig {
  maxGwei?: string;
  delay?: string;
  walletsRandomizer?: boolean;
  tgLogsSender?: boolean;
  retry?: string;
  walletsInBatch?: string;
}

const Dashboard = () => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<'twitter' | 'settings' | 'accounts'>('twitter');
  const [accountGroups, setAccountGroups] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const actions = [
    'Follow',
    'Like',
    'Retweet',
    'Tweet',
    'Comment',
    'Unfollow',
    'Unlike',
    // 'Unretweet',
    // 'Change profile',
    'Vote in the poll',
  ];

  const renderModule = () => {
    switch (selectedAction) {
      case 'Follow':
      case 'Unfollow':
        return (
          <FollowModule 
            type={selectedAction as 'Follow' | 'Unfollow'} 
            accountGroups={accountGroups}
          />
        );
      case 'Like':
      case 'Unlike':
        return (
          <LikeModule 
            type={selectedAction as 'Like' | 'Unlike'} 
            accountGroups={accountGroups}
          />
        );
      case 'Retweet':
      case 'Unretweet':
        return (
          <RetweetModule 
            type={selectedAction as 'Retweet' | 'Unretweet'} 
            accountGroups={accountGroups}
          />
        );
      case 'Comment':
        return (
          <CommentModule 
            accountGroups={accountGroups}
          />
        );
      case 'Tweet':
        return (
          <TweetModule 
            accountGroups={accountGroups}
          />
        );
      case 'Vote in the poll':
        return (
          <VoteModule 
            accountGroups={accountGroups}
          />
        );
      case 'Change profile':
        return (
          <ChangeProfile 
            accountGroups={accountGroups}
          />
        );
      default:
        return null;
    }
  };

  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 8,
      left: rect.left
    });
    setIsDropdownOpen(!isDropdownOpen);
  };

  const renderContent = () => {
    switch (selectedSection) {
      case 'settings':
        return <Settings />;
      case 'accounts':
        return <Accounts />;
      case 'twitter':
        return selectedAction ? (
          <div className="config-panel">
            {renderModule()}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">      
      <div className="dashboard-content">
        <div className="dashboard-controls">
          <div className="dashboard-select-wrapper">
            <button
              className={`dashboard-select-button ${selectedAction && selectedSection === 'twitter' ? 'active' : ''}`}
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setSelectedSection('twitter');
              }}
            >
              <FiCommand size={16} className="dashboard-select-icon-left" />
              <span className="dashboard-select-button-text">
                {selectedSection === 'twitter' ? (selectedAction || 'Select Action') : 'Select Action'}
              </span>
              <FiChevronDown size={20} className={`dashboard-select-icon ${isDropdownOpen ? 'rotated' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <>
                <div className="dropdown-overlay" onClick={() => setIsDropdownOpen(false)} />
                <div className="dropdown-menu">
                  {actions.map((action) => (
                    <div
                      key={action}
                      className={`dropdown-item ${selectedAction === action ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedAction(action);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {action}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            className={`dashboard-nav-button ${selectedSection === 'accounts' ? 'active' : ''}`}
            onClick={() => {
              setSelectedSection('accounts');
              setSelectedAction(null);
            }}
          >
            <FiUsers size={16} />
            <span>Accounts</span>
          </button>

          <button
            className={`dashboard-nav-button ${selectedSection === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setSelectedSection('settings');
              setSelectedAction(null);
            }}
          >
            <FiSettings size={16} />
            <span>Settings</span>
          </button>
        </div>
        
        <div className="dashboard-divider" />
        
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;