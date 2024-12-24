import { useState } from 'react';
import FollowModule from '../components/modules/twitter/FollowModule/FollowModule';
import CommentModule from '../components/modules/twitter/CommentModule/CommentModule';
import RetweetModule from '../components/modules/twitter/RetweetModule/RetweetModule';
import TweetModule from '../components/modules/twitter/TweetModule/TweetModule';
import VoteModule from '../components/modules/twitter/VoteModule/Vote';
import LikeModule from '../components/modules/twitter/LikeModule/LikeModule';
import { FiCommand, FiChevronDown } from "react-icons/fi";
import "./Dashboard.css";

interface ActionConfig {
  maxGwei?: string;
  delay?: string;
  walletsRandomizer?: boolean;
  tgLogsSender?: boolean;
  retry?: string;
  walletsInBatch?: string;
}

const TwitterDashboard = () => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [accountGroups, setAccountGroups] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const actions = [
    'Follow',
    'Like',
    'Retweet',
    'Tweet',
    'Comment',
    'Unfollow',
    'Unlike',
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
              className={`dashboard-select-button ${selectedAction ? 'active' : ''}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <FiCommand size={16} className="dashboard-select-icon-left" />
              <span className="dashboard-select-button-text">
                {selectedAction || 'Select Action'}
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
        </div>
        
        <div className="dashboard-divider" />
        
        {renderContent()}
      </div>
    </div>
  );
};

export default TwitterDashboard;
