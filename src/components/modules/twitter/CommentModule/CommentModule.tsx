import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiUsers, FiZap, FiPower, FiSettings, FiTwitter, FiUpload } from 'react-icons/fi';
import './CommentModule.css';
import ModuleTable, { AccountStatus } from '../../../common/ModuleTable/ModuleTable';
import accountsService, { AccountsBase, AccountData } from '../../../../services/accountsService';
import '../../../../styles/buttons.css';
import Progress, { ProgressRef } from '../../../common/Progress/Progress';
import { API_CONFIG } from '../../../../config/settings';
import Toast from '../../../common/Toast';

interface CommentModuleProps {
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

const CommentModule = ({ accountGroups }: CommentModuleProps) => {
  const [tweetLinkInput, setTweetLinkInput] = useState('');
  const [tweetLinks, setTweetLinks] = useState<string[]>([]);
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
      if (tweetLinks.length === 0 || comments.length === 0) {
        setShowUsernameAlert(true);
        return;
      }
      if (!selectedGroup) {
        setShowAccountAlert(true);
        return;
      }
      setIsRunning(true);
      sendCommentRequests();
    }
  };

  const getRandomPause = (pauseRange: number[]) => {
    const [min, max] = pauseRange;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const sendCommentRequests = async () => {
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

      for (let linkIndex = 0; linkIndex < tweetLinks.length; linkIndex++) {
        const tweetLink = tweetLinks[linkIndex];
        
        try {
          // Выбор текста комментария
          let content: string;
          if (fetchedConfig.take_data_random) {
            // Случайный выбор текста из списка
            const randomIndex = Math.floor(Math.random() * comments.length);
            content = comments[randomIndex];
          } else {
            // Последовательный выбор текста
            const commentIndex = linkIndex % comments.length;
            content = comments[commentIndex];
          }

          const response = await fetch(`${API_CONFIG.SERVER_URL}/api/comment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              auth_token: account.token,
              proxy: account.proxy,
              content: content,
              tweet_link: tweetLink
            }),
            signal: abortControllerRef.current?.signal,
          });

          const result = await response.json();
          account.status = result.status ? 'SUCCESS' : 'FAILED';
          account.logs = result.logs || [];
          
          // Обновляем username из ответа сервера
          if (result.data && result.data.username) {
            account.username = result.data.username;
          }

          // Обновляем статистику
          if (result.status) {
            const successCount = activeAccounts.filter(a => a.status === 'SUCCESS').length;
            const failedCount = activeAccounts.filter(a => ['FAILED', 'ERROR'].includes(a.status as string)).length;
            progressRef.current?.updateStats(successCount, failedCount);
          } else {
            const successCount = activeAccounts.filter(a => a.status === 'SUCCESS').length;
            const failedCount = activeAccounts.filter(a => ['FAILED', 'ERROR'].includes(a.status as string)).length;
            progressRef.current?.updateStats(successCount, failedCount);
          }

          // Пауза между комментариями
          if (linkIndex < tweetLinks.length - 1) {
            const pauseTime = getRandomPause(fetchedConfig.pause_between_tasks);
            await new Promise(resolve => setTimeout(resolve, pauseTime * 1000));
          }

        } catch (error: any) {
          if (error.name === 'AbortError') {
            account.status = 'CANCELLED' as AccountStatus;
            account.logs = ['Request was cancelled'];
          } else {
            console.error('Error sending comment request:', error);
            account.status = 'ERROR' as AccountStatus;
            account.logs = ['Error sending request'];
          }
          
          // Обновляем статистику при ошибке
          const successCount = activeAccounts.filter(a => a.status === 'SUCCESS').length;
          const failedCount = activeAccounts.filter(a => ['FAILED', 'ERROR'].includes(a.status as string)).length;
          progressRef.current?.updateStats(successCount, failedCount);
        }
      }

      progressRef.current?.increment();

      // Пауза между аккаунтами
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

  const handleImportTweetLinks = async () => {
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

        setTweetLinks(prev => [...new Set([...prev, ...lines])]);
      };

      input.click();
    } catch (error) {
      console.error('Error importing tweet links:', error);
    }
  };

  const handleTweetLinkKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tweetLinkInput.trim()) {
      setTweetLinks([...tweetLinks, tweetLinkInput.trim()]);
      setTweetLinkInput('');
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && commentInput.trim()) {
      setComments([...comments, commentInput.trim()]);
      setCommentInput('');
    }
  };

  const removeTweetLink = (index: number) => {
    setTweetLinks(tweetLinks.filter((_, i) => i !== index));
  };

  const removeComment = (index: number) => {
    setComments(comments.filter((_, i) => i !== index));
  };

  return (
    <div className="comment-module">
      <div className="comment-module-controls">
        <div className="comment-module-controls-divider-left" />
        <div className="comment-module-controls-divider-right" />
        
        <div className="comment-controls-section">
          <div className="comment-buttons-row">
            <button 
              className="comment-choose-accounts-btn"
              onClick={() => setIsAccountModalOpen(true)}
            >
              <FiUsers size="1.2em" />
              {selectedGroup ? 
                selectedAccounts.find(g => g.accounts_name === selectedGroup)?.accounts_name : 
                'Choose Accounts'}
            </button>
            <button 
              className="comment-default-settings-btn"
              onClick={handleSetDefaultSettings}
            >
              <FiSettings size="1.2em" />
              Set Default Settings
            </button>
          </div>
          
          <div className="comment-buttons-row">
            <div className="comment-control-group">
              <div className="comment-control-label">Accounts Range</div>
              <div className="comment-range-inputs">
                <input 
                  type="number" 
                  className="comment-range-input"
                  placeholder="Start"
                  min="0"
                  value={range.start}
                  onChange={(e) => setRange(prev => ({ ...prev, start: parseInt(e.target.value) || 0 }))}
                />
                <input 
                  type="number" 
                  className="comment-range-input"
                  placeholder="End"
                  min="0"
                  value={range.end}
                  onChange={(e) => setRange(prev => ({ ...prev, end: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div className="comment-control-group">
              <div className="comment-control-label">Threads</div>
              <input 
                type="number" 
                className="comment-threads-input"
                min="1"
                value={threads}
                onChange={(e) => setThreads(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <button 
            className={`comment-start-btn ${isRunning ? 'comment-stop-btn' : ''}`}
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

        <div className="comment-content-section">
          <div className="comment-links-column">
            <button 
              className="comment-import-btn"
              onClick={handleImportTweetLinks}
            >
              <FiUpload size="1.2em" />
              Import Tweet Links
            </button>
            <input
              type="text"
              value={tweetLinkInput}
              onChange={(e) => setTweetLinkInput(e.target.value)}
              onKeyDown={handleTweetLinkKeyDown}
              placeholder="Enter tweet links..."
              className="comment-tweet-input"
            />
            <div className="comment-list-container">
              {tweetLinks.map((link, index) => (
                <div key={index} className="comment-item">
                  <span>{link}</span>
                  <button 
                    className="comment-remove-btn" 
                    onClick={() => removeTweetLink(index)}
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="comment-text-column">
            <button 
              className="comment-import-btn"
              onClick={handleImportComments}
            >
              <FiUpload size="1.2em" />
              Import Comments
            </button>
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={handleCommentKeyDown}
              placeholder="Enter comment text..."
              className="comment-input"
            />
            <div className="comment-list-container">
              {comments.map((comment, index) => (
                <div key={index} className="comment-item">
                  <span>{comment}</span>
                  <button 
                    className="comment-remove-btn" 
                    onClick={() => removeComment(index)}
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Progress 
          moduleId="comment-module" 
          ref={progressRef}
        />
      </div>

      <div className="comment-module-divider" />

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
        <div className="comment-logs-modal-overlay" onClick={() => setShowLogsModal(false)}>
          <div className="comment-logs-modal" onClick={e => e.stopPropagation()}>
            <div className="comment-logs-modal-header">
              <h3>Action Logs</h3>
              <button className="comment-close-modal-btn" onClick={() => setShowLogsModal(false)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="comment-logs-modal-content">
              {selectedLogs.map((log, index) => (
                <div key={index} className="comment-log-entry">{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isAccountModalOpen && (
        <div className="comment-account-select-overlay" onClick={() => setIsAccountModalOpen(false)}>
          <div className="comment-account-select-container" onClick={e => e.stopPropagation()}>
            <div className="comment-accounts-header">
              <h2>Select Account Group</h2>
              <button className="comment-close-modal-btn" onClick={() => setIsAccountModalOpen(false)}>
                <FiX size={24} />
              </button>
            </div>
            <div className="comment-accounts-divider" />
            <div className="comment-accounts-groups">
              {selectedAccounts.map(group => (
                <div 
                  key={group.accounts_name} 
                  className={`comment-group-container ${selectedGroup === group.accounts_name ? 'active' : ''}`}
                  onClick={() => handleGroupSelect(group.accounts_name)}
                >
                  <div className="comment-group-content">
                    <FiTwitter size={24} color="#1DA1F2" />
                    <h3 className="comment-group-name">{group.accounts_name}</h3>
                    <span className="comment-accounts-count">
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
        message="Please add at least one tweet link and one comment."
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

export default CommentModule; 