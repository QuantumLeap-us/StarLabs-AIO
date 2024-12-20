import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiUsers, FiZap, FiPower, FiSettings, FiTwitter, FiUpload } from 'react-icons/fi';
import './Vote.css';
import ModuleTable, { AccountStatus } from '../../../common/ModuleTable/ModuleTable';
import accountsService, { AccountsBase, AccountData } from '../../../../services/accountsService';
import '../../../../styles/buttons.css';
import Progress, { ProgressRef } from '../../../common/Progress/Progress';
import { API_CONFIG } from '../../../../config/settings';
import Toast from '../../../common/Toast';

interface VoteModuleProps {
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

const VoteModule = ({ accountGroups }: VoteModuleProps) => {
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<string[]>([]);
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
  const [answerInput, setAnswerInput] = useState('');

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

  const handleSetDefaultSettings = () => {
    setThreads(1);
    setRange({ start: 0, end: 0 });
  };

  const handleStartStop = () => {
    if (isRunning) {
      abortControllerRef.current?.abort();
      setIsRunning(false);
    } else {
      if (!commentInput || !answerInput) {
        setShowUsernameAlert(true);
        return;
      }
      if (!selectedGroup) {
        setShowAccountAlert(true);
        return;
      }
      setIsRunning(true);
      sendVoteRequests();
    }
  };

  const getRandomPause = (pauseRange: number[]) => {
    const [min, max] = pauseRange;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const sendVoteRequests = async () => {
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

      try {
        const response = await fetch(`${API_CONFIG.SERVER_URL}/api/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auth_token: account.token,
            proxy: account.proxy,
            tweet_link: commentInput,
            answer: answerInput,
          }),
          signal: abortControllerRef.current?.signal,
        });

        const result = await response.json();
        account.status = result.status ? 'SUCCESS' : 'FAILED';
        account.logs = result.logs || [];
        
        if (result.data && result.data.username) {
          account.username = result.data.username;
        }

        if (result.status) {
          const successCount = activeAccounts.filter(a => a.status === 'SUCCESS').length;
          const failedCount = activeAccounts.filter(a => ['FAILED', 'ERROR'].includes(a.status as string)).length;
          progressRef.current?.updateStats(successCount, failedCount);
        } else {
          const successCount = activeAccounts.filter(a => a.status === 'SUCCESS').length;
          const failedCount = activeAccounts.filter(a => ['FAILED', 'ERROR'].includes(a.status as string)).length;
          progressRef.current?.updateStats(successCount, failedCount);
        }
        
        const pauseTime = getRandomPause(fetchedConfig.pause_between_accounts);
        await new Promise(resolve => setTimeout(resolve, pauseTime * 1000));

      } catch (error: any) {
        if (error.name === 'AbortError') {
          account.status = 'CANCELLED' as AccountStatus;
          account.logs = ['Request was cancelled'];
        } else {
          console.error('Error sending vote request:', error);
          account.status = 'ERROR' as AccountStatus;
          account.logs = ['Error sending request'];
        }
        
        const successCount = activeAccounts.filter(a => a.status === 'SUCCESS').length;
        const failedCount = activeAccounts.filter(a => ['FAILED', 'ERROR'].includes(a.status as string)).length;
        progressRef.current?.updateStats(successCount, failedCount);
      }

      progressRef.current?.increment();
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

  const handleImportComments = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.txt';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const text = await file.text();
        const lines = text.split('\n')
          .map(line => line.trim())
          .filter(line => line !== '');

        setComments(prev => [...new Set([...prev, ...lines])]);
      };

      input.click();
    } catch (error) {
      console.error('Error importing comments:', error);
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && commentInput.trim()) {
      setComments([...comments, commentInput.trim()]);
      setCommentInput('');
    }
  };

  const removeComment = (index: number) => {
    setComments(comments.filter((_, i) => i !== index));
  };

  const handleAnswerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && answerInput.trim()) {
      // Обработка ввода ответа
      setAnswerInput('');
    }
  };

  return (
    <div className="vote-module">
      <div className="vote-module-controls">
        <div className="vote-module-controls-divider-left" />
        <div className="vote-module-controls-divider-right" />
        
        <div className="vote-controls-section">
          <div className="vote-buttons-row">
            <button 
              className="vote-choose-accounts-btn"
              onClick={() => setIsAccountModalOpen(true)}
            >
              <FiUsers size="1.2em" />
              {selectedGroup ? 
                selectedAccounts.find(g => g.accounts_name === selectedGroup)?.accounts_name : 
                'Choose Accounts'}
            </button>
            <button 
              className="vote-default-settings-btn"
              onClick={handleSetDefaultSettings}
            >
              <FiSettings size="1.2em" />
              Set Default Settings
            </button>
          </div>
          
          <div className="vote-buttons-row">
            <div className="vote-control-group">
              <div className="vote-control-label">Accounts Range</div>
              <div className="vote-range-inputs">
                <input 
                  type="number" 
                  className="vote-range-input"
                  placeholder="Start"
                  min="0"
                  value={range.start}
                  onChange={(e) => setRange(prev => ({ ...prev, start: parseInt(e.target.value) || 0 }))}
                />
                <input 
                  type="number" 
                  className="vote-range-input"
                  placeholder="End"
                  min="0"
                  value={range.end}
                  onChange={(e) => setRange(prev => ({ ...prev, end: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div className="vote-control-group">
              <div className="vote-control-label">Threads</div>
              <input 
                type="number" 
                className="vote-threads-input"
                min="1"
                value={threads}
                onChange={(e) => setThreads(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <button 
            className={`vote-start-btn ${isRunning ? 'vote-stop-btn' : ''}`}
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

        <div className="vote-content-section">
          <div className="vote-text-column">
            <div className="vote-input-group">
              <div className="vote-input-label">Vote link</div>
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={handleCommentKeyDown}
                placeholder="Enter vote link..."
                className="vote-input"
              />
            </div>
            <div className="vote-input-group">
              <div className="vote-input-label">Answer</div>
              <input
                type="text"
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                onKeyDown={handleAnswerKeyDown}
                placeholder="Enter answer..."
                className="vote-input"
              />
            </div>
          </div>
        </div>

        <Progress 
          moduleId="vote-module" 
          ref={progressRef}
        />
      </div>

      <div className="vote-module-divider" />

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
        <div className="vote-logs-modal-overlay" onClick={() => setShowLogsModal(false)}>
          <div className="vote-logs-modal" onClick={e => e.stopPropagation()}>
            <div className="vote-logs-modal-header">
              <h3>Action Logs</h3>
              <button className="vote-close-modal-btn" onClick={() => setShowLogsModal(false)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="vote-logs-modal-content">
              {selectedLogs.map((log, index) => (
                <div key={index} className="vote-log-entry">{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isAccountModalOpen && (
        <div className="vote-account-select-overlay" onClick={() => setIsAccountModalOpen(false)}>
          <div className="vote-account-select-container" onClick={e => e.stopPropagation()}>
            <div className="vote-accounts-header">
              <h2>Select Account Group</h2>
              <button className="vote-close-modal-btn" onClick={() => setIsAccountModalOpen(false)}>
                <FiX size={24} />
              </button>
            </div>
            <div className="vote-accounts-divider" />
            <div className="vote-accounts-groups">
              {selectedAccounts.map(group => (
                <div 
                  key={group.accounts_name} 
                  className={`vote-group-container ${selectedGroup === group.accounts_name ? 'active' : ''}`}
                  onClick={() => handleGroupSelect(group.accounts_name)}
                >
                  <div className="vote-group-content">
                    <FiTwitter size={24} color="#1DA1F2" />
                    <h3 className="vote-group-name">{group.accounts_name}</h3>
                    <span className="vote-accounts-count">
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
        message="Please enter both vote link and answer."
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

export default VoteModule; 