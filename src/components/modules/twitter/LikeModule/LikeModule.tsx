import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiUsers, FiZap, FiPower, FiSettings, FiTwitter } from 'react-icons/fi';
import './LikeModule.css';
import ModuleTable, { AccountStatus } from '../../../common/ModuleTable/ModuleTable';
import accountsService, { AccountsBase, AccountData } from '../../../../services/accountsService';
import '../../../../styles/buttons.css';
import Progress, { ProgressRef } from '../../../common/Progress/Progress';
import { API_CONFIG } from '../../../../config/settings';
import Toast from '../../../common/Toast';

interface LikeModuleProps {
  type: 'Like' | 'Unlike';
  accountGroups: string[];
}

interface Config {
  take_data_random: boolean;
  max_tasks_retries: number;
  pause_between_tasks: number[];
  pause_between_accounts: number[];
}

interface Account extends AccountData {
  username: string;
  status: AccountStatus;
  logs: string[];
}

interface AccountGroup {
  accounts_name: string;
  accounts: Account[];
}

const LikeModule = ({ type, accountGroups }: LikeModuleProps) => {
  const [inputValue, setInputValue] = useState('');
  const [usersList, setUsersList] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [range, setRange] = useState({ start: 0, end: 0 });
  const [threads, setThreads] = useState(1);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<AccountGroup[]>([]);
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([]);
  const progressRef = useRef<ProgressRef>(null);
  const [showUsernameAlert, setShowUsernameAlert] = useState(false);
  const [showAccountAlert, setShowAccountAlert] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [fetchedConfig, setFetchedConfig] = useState<Config | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_CONFIG.SERVER_URL}${API_CONFIG.API_ENDPOINTS.CONFIG}`);
        if (response.ok) {
          const configData = await response.json();
          setFetchedConfig(configData);
        } else {
          console.error('Failed to fetch config');
        }
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const bases = await accountsService.getAllBases();
      setSelectedAccounts(bases as unknown as AccountGroup[]);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const handleGroupSelect = (groupName: string) => {
    setSelectedGroup(groupName);
    const group = selectedAccounts.find(g => g.accounts_name === groupName);
    if (group) {
      const accounts = group.accounts.map(account => ({
        ...account,
        username: '',
        status: 'IDLE' as AccountStatus,
        logs: []
      }));
      setActiveAccounts(accounts);
      setSelectedAccounts([{ accounts_name: group.accounts_name, accounts }]);
      progressRef.current?.setTotal(accounts.length);
      progressRef.current?.reset();
    }
    setIsAccountModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSetDefaultSettings = () => {
    setThreads(1);
    setRange({ start: 0, end: 0 });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      setUsersList([...usersList, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeUser = (index: number) => {
    setUsersList(usersList.filter((_, i) => i !== index));
  };

  const handleStartStop = () => {
    if (isRunning) {
      abortControllerRef.current?.abort();
      setIsRunning(false);
    } else {
      if (usersList.length === 0) {
        setShowUsernameAlert(true);
        return;
      }
      if (!selectedGroup) {
        setShowAccountAlert(true);
        return;
      }
      setIsRunning(true);
      sendFollowRequests();
    }
  };

  const getRandomPause = (pauseRange: number[]) => {
    const [min, max] = pauseRange;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const sendFollowRequests = async () => {
    if (!fetchedConfig) {
      console.error('Config is undefined');
      return;
    }

    const updatedAccounts = [...activeAccounts];
    abortControllerRef.current = new AbortController();

    const start = range.start || 0;
    const end = range.end || activeAccounts.length - 1;
    const accountsToProcess = updatedAccounts.slice(start, end + 1);
    const totalAccounts = accountsToProcess.length;

    progressRef.current?.setTotal(totalAccounts);
    progressRef.current?.reset();

    const processAccount = async (account: Account) => {
      account.status = 'PROCESS...';
      setActiveAccounts([...updatedAccounts]);

      for (let tweetIndex = 0; tweetIndex < usersList.length; tweetIndex++) {
        const tweetLink = usersList[tweetIndex];

        try {
          const endpoint = type === 'Like' ? '/api/like' : '/api/unlike';
          const response = await fetch(`${API_CONFIG.SERVER_URL}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              auth_token: account.token,
              proxy: account.proxy,
              tweet_link: tweetLink,
            }),
            signal: abortControllerRef.current?.signal,
          });

          const result = await response.json();
          account.status = result.status ? 'SUCCESS' : 'FAILED';
          account.logs = result.logs || [];

          if (result.status) {
            // Увеличиваем счетчик успешных
            const successCount = activeAccounts.filter(a => a.status === 'SUCCESS').length;
            const failedCount = activeAccounts.filter(a => ['FAILED', 'ERROR'].includes(a.status as string)).length;
            progressRef.current?.updateStats(successCount, failedCount);
          } else {
            // Увеличиваем счетчик ошибок
            const successCount = activeAccounts.filter(a => a.status === 'SUCCESS').length;
            const failedCount = activeAccounts.filter(a => ['FAILED', 'ERROR'].includes(a.status as string)).length;
            progressRef.current?.updateStats(successCount, failedCount);
          }
          
          if (result.data && result.data.username) {
            account.username = result.data.username;
          }

          if (tweetIndex < usersList.length - 1) {
            const pauseTime = getRandomPause(fetchedConfig.pause_between_tasks);
            await new Promise(resolve => setTimeout(resolve, pauseTime * 1000));
          }

        } catch (error: any) {
          if (error.name === 'AbortError') {
            account.status = 'CANCELLED' as AccountStatus;
            account.logs = ['Request was cancelled'];
          } else {
            console.error('Error sending follow request:', error);
            account.status = 'ERROR' as AccountStatus;
            account.logs = ['Error sending request'];
          }
        }
      }

      progressRef.current?.increment();

      const pauseTime = getRandomPause(fetchedConfig.pause_between_accounts);
      await new Promise(resolve => setTimeout(resolve, pauseTime * 1000));
    };

    const processAccountsInBatches = async () => {
      for (let i = 0; i < accountsToProcess.length; i += threads) {
        const batch = accountsToProcess.slice(i, i + threads);
        await Promise.all(batch.map(account => processAccount(account)));
      }
    };

    await processAccountsInBatches();
    setActiveAccounts(updatedAccounts);
    setIsRunning(false);
  };

  return (
    <div className="like-module">
      <div className="like-module-controls">
        <div className="like-module-controls-divider-left" />
        <div className="like-module-controls-divider-right" />
        
        <div className="like-controls-section">
          <div className="like-buttons-row">
            <button 
              className="like-choose-accounts-btn"
              onClick={() => setIsAccountModalOpen(true)}
            >
              <FiUsers size="1.2em" />
              {selectedGroup ? 
                selectedAccounts.find(g => g.accounts_name === selectedGroup)?.accounts_name : 
                'Choose Accounts'}
            </button>
            <button 
              className="like-default-settings-btn"
              onClick={handleSetDefaultSettings}
            >
              <FiSettings size="1.2em" />
              Set Default Settings
            </button>
          </div>
          
          <div className="like-buttons-row">
            <div className="like-control-group">
              <div className="like-control-label">Accounts Range</div>
              <div className="like-range-inputs">
                <input 
                  type="number" 
                  className="like-range-input"
                  placeholder="Start"
                  min="0"
                  value={range.start}
                  onChange={(e) => setRange(prev => ({ ...prev, start: parseInt(e.target.value) || 0 }))}
                />
                <input 
                  type="number" 
                  className="like-range-input"
                  placeholder="End"
                  min="0"
                  value={range.end}
                  onChange={(e) => setRange(prev => ({ ...prev, end: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div className="like-control-group">
              <div className="like-control-label">Threads</div>
              <input 
                type="number" 
                className="like-threads-input"
                min="1"
                value={threads}
                onChange={(e) => setThreads(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <button 
            className={`like-start-btn ${isRunning ? 'like-stop-btn' : ''}`}
            onClick={handleStartStop}
          >
            {isRunning ? (
              <>
                <FiPower size="1.2em" />
                Stop
              </>
            ) : (
              <>
                <FiZap size="1.2em" />
                Start
              </>
            )}
          </button>
        </div>

        <div className="like-usernames-section">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Enter links to ${type.toLowerCase()}...`}
            className="like-users-input"
          />
          <div className="like-users-list-container">
            {usersList.length === 0 ? (
              <div className="like-users-list-placeholder">
                @example @username
              </div>
            ) : (
              usersList.map((user, index) => (
                <div key={index} className="like-user-item">
                  <span>{user}</span>
                  <button 
                    className="like-remove-user-btn" 
                    onClick={() => removeUser(index)}
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <Progress 
          moduleId="like-module" 
          ref={progressRef}
        />
      </div>

      <div className="like-module-divider" />

      {activeAccounts.length > 0 && (
        <ModuleTable
          accounts={activeAccounts}
          onStatusClick={logs => {
            setSelectedLogs(logs);
            setShowLogsModal(true);
          }}
          onStatusChange={(index, status) => {
            setActiveAccounts(prevAccounts => {
              const newAccounts = [...prevAccounts];
              newAccounts[index] = { ...newAccounts[index], status };
              return newAccounts;
            });
          }}
        />
      )}

      {showLogsModal && (
        <div className="like-logs-modal-overlay" onClick={() => setShowLogsModal(false)}>
          <div className="like-logs-modal" onClick={e => e.stopPropagation()}>
            <div className="like-logs-modal-header">
              <h3>Action Logs</h3>
              <button className="like-close-modal-btn" onClick={() => setShowLogsModal(false)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="like-logs-modal-content">
              {selectedLogs.map((log, index) => (
                <div key={index} className="like-log-entry">{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isAccountModalOpen && (
        <div className="like-account-select-overlay" onClick={() => setIsAccountModalOpen(false)}>
          <div className="like-account-select-container" onClick={e => e.stopPropagation()}>
            <div className="like-accounts-header">
              <h2>Select Account Group</h2>
              <button className="like-close-modal-btn" onClick={() => setIsAccountModalOpen(false)}>
                <FiX size={24} />
              </button>
            </div>
            <div className="like-accounts-divider" />
            <div className="like-accounts-groups">
              {selectedAccounts.map(group => (
                <div 
                  key={group.accounts_name} 
                  className={`like-group-container ${selectedGroup === group.accounts_name ? 'active' : ''}`}
                  onClick={() => handleGroupSelect(group.accounts_name)}
                >
                  <div className="like-group-content">
                    <FiTwitter size={24} color="#1DA1F2" />
                    <h3 className="like-group-name">{group.accounts_name}</h3>
                    <span className="like-accounts-count">
                      {group.accounts.length} Accounts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Toast 
        message={`Please enter at least one link to ${type.toLowerCase()}.`}
        isVisible={showUsernameAlert}
        onHide={() => setShowUsernameAlert(false)}
      />

      <Toast 
        message="Please choose accounts before starting."
        isVisible={showAccountAlert}
        onHide={() => setShowAccountAlert(false)}
      />
    </div>
  );
};

export default LikeModule; 