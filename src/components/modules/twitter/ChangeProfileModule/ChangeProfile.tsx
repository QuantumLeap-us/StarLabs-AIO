import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiUsers, FiZap, FiPower, FiSettings, FiTwitter, FiUpload, FiImage, FiCalendar, FiFileText, FiMapPin, FiUser, FiLock, FiAtSign } from 'react-icons/fi';
import './ChangeProfile.css';
import ModuleTable, { AccountStatus } from '../../../common/ModuleTable/ModuleTable';
import accountsService, { AccountsBase, AccountData } from '../../../../services/accountsService';
import '../../../../styles/buttons.css';
import Progress, { ProgressRef } from '../../../common/Progress/Progress';
import { API_CONFIG } from '../../../../config/settings';
import Toast from '../../../common/Toast';

interface ChangeProfileProps {
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

interface ProfileModule {
  name: string;
  icon: React.ReactNode;
  importText: string;
}

interface ProfileData {
  type: string;
  value: string;
  displayName?: string;
}

interface PasswordChangeResponse {
  status: boolean;
  data?: {
    username?: string;
    auth_token?: string;
  };
  logs?: string[];
  error_type?: string;
}

const ChangeProfile = ({ accountGroups }: ChangeProfileProps) => {
  const [profileData, setProfileData] = useState<ProfileData[]>([]);
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
  const [selectedModule, setSelectedModule] = useState<ProfileModule | null>(null);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);

  const availableModules: ProfileModule[] = [
    {
      name: 'Change background',
      icon: <FiImage size={20} />,
      importText: 'Import Background Pictures'
    },
    {
      name: 'Change birthdate',
      icon: <FiCalendar size={20} />,
      importText: 'Import Birthdates'
    },
    {
      name: 'Change description',
      icon: <FiFileText size={20} />,
      importText: 'Import Descriptions'
    },
    {
      name: 'Change location',
      icon: <FiMapPin size={20} />,
      importText: 'Import Locations'
    },
    {
      name: 'Change name',
      icon: <FiUser size={20} />,
      importText: 'Import Names'
    },
    {
      name: 'Change password',
      icon: <FiLock size={20} />,
      importText: 'Import Passwords'
    },
    {
      name: 'Change profile picture',
      icon: <FiImage size={20} />,
      importText: 'Import Profile Pictures'
    },
    {
      name: 'Change username',
      icon: <FiAtSign size={20} />,
      importText: 'Import Usernames'
    }
  ];

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
      if (profileData.length === 0) {
        setShowUsernameAlert(true);
        return;
      }
      if (!selectedGroup) {
        setShowAccountAlert(true);
        return;
      }
      setIsRunning(true);
      sendProfileRequests();
    }
  };

  const getRandomPause = (pauseRange: number[]) => {
    const [min, max] = pauseRange;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const sendProfileRequests = async () => {
    if (!fetchedConfig || !selectedModule) {
      console.error('Config or module is undefined');
      return;
    }

    const updatedAccounts = [...activeAccounts];
    abortControllerRef.current = new AbortController();

    const start = range.start || 0;
    const end = range.end || activeAccounts.length - 1;
    const accountsToProcess = updatedAccounts.slice(start, end + 1);

    progressRef.current?.setTotal(accountsToProcess.length);
    progressRef.current?.reset();

    const processAccount = async (account: Account) => {
      account.status = 'PROCESS...';
      setActiveAccounts([...updatedAccounts]);

      for (const data of profileData) {
        try {
          let endpoint = '';
          let requestBody = {};

          switch (selectedModule.name) {
            case 'Change background':
              endpoint = '/api/change-background';
              requestBody = {
                auth_token: account.token,
                proxy: account.proxy,
                picture_base64_encoded: data.value
              };
              break;
            case 'Change birthdate':
              endpoint = '/api/change-birthdate';
              requestBody = {
                auth_token: account.token,
                proxy: account.proxy,
                new_birthdate: data.value
              };
              break;
            case 'Change description':
              endpoint = '/api/change-description';
              requestBody = {
                auth_token: account.token,
                proxy: account.proxy,
                new_description: data.value
              };
              break;
            case 'Change location':
              endpoint = '/api/change-location';
              requestBody = {
                auth_token: account.token,
                proxy: account.proxy,
                new_location: data.value
              };
              break;
            case 'Change name':
              endpoint = '/api/change-name';
              requestBody = {
                auth_token: account.token,
                proxy: account.proxy,
                new_name: data.value
              };
              break;
            case 'Change password':
              endpoint = '/api/change-password';
              requestBody = {
                auth_token: account.token,
                proxy: account.proxy,
                old_password: '',
                new_password: data.value
              };
              break;
            case 'Change profile picture':
              endpoint = '/api/change-profile-picture';
              requestBody = {
                auth_token: account.token,
                proxy: account.proxy,
                picture_base64_encoded: data.value
              };
              break;
            case 'Change username':
              endpoint = '/api/change-username';
              requestBody = {
                auth_token: account.token,
                proxy: account.proxy,
                new_username: data.value
              };
              break;
            default:
              throw new Error('Unknown module type');
          }

          const response = await fetch(`${API_CONFIG.SERVER_URL}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: abortControllerRef.current?.signal,
          });

          const result = await response.json();
          
          if (result.status) {
            account.status = 'SUCCESS';
            if (result.data?.username) {
              account.username = result.data.username;
            }
            if (selectedModule.name === 'Change password' && result.data?.auth_token) {
              account.token = result.data.auth_token;
            }
          } else {
            account.status = 'FAILED';
            switch (result.error_type) {
              case 'locked':
                account.logs = ['Account is locked'];
                break;
              case 'unauthenticated':
                account.logs = ['Authentication failed'];
                break;
              default:
                account.logs = result.logs || ['Unknown error occurred'];
            }
          }

          const successCount = activeAccounts.filter(a => a.status === 'SUCCESS').length;
          const failedCount = activeAccounts.filter(a => ['FAILED', 'ERROR'].includes(a.status as string)).length;
          progressRef.current?.updateStats(successCount, failedCount);

          if (data !== profileData[profileData.length - 1]) {
            const pauseTime = getRandomPause(fetchedConfig.pause_between_tasks);
            await new Promise(resolve => setTimeout(resolve, pauseTime * 1000));
          }

        } catch (error: any) {
          if (error.name === 'AbortError') {
            account.status = 'CANCELLED' as AccountStatus;
            account.logs = ['Request was cancelled'];
          } else {
            console.error('Error sending request:', error);
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

  const handleImportData = async () => {
    try {
      const input = document.createElement('input');
      
      if (selectedModule?.name === 'Change background' || selectedModule?.name === 'Change profile picture') {
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
      } else {
        input.type = 'file';
        input.accept = '.txt';
      }
      
      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files) return;

        if (selectedModule?.name === 'Change background' || selectedModule?.name === 'Change profile picture') {
          const newData: ProfileData[] = [];
          
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
              const base64String = await convertFileToBase64(file);
              newData.push({
                type: selectedModule.name,
                value: base64String,
                displayName: file.name
              });
            } catch (error) {
              console.error(`Error processing image ${file.name}:`, error);
            }
          }

          setProfileData(prev => [...prev, ...newData]);
        } else {
          const file = files[0];
          const text = await file.text();
          const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line !== '');

          const newData = lines.map(line => ({
            type: selectedModule?.name || '',
            value: line
          }));

          setProfileData(prev => [...prev, ...newData]);
        }
      };

      input.click();
    } catch (error) {
      console.error('Error importing data:', error);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeItem = (index: number) => {
    setProfileData(prev => prev.filter((_, i) => i !== index));
  };

  const handleModuleSelect = (module: ProfileModule) => {
    setSelectedModule(module);
    setIsModuleModalOpen(false);
  };

  return (
    <div className="change-profile-module">
      <div className="change-profile-module-controls">
        <div className="change-profile-module-controls-divider-left" />
        <div className="change-profile-module-controls-divider-right" />
        
        <div className="change-profile-controls-section">
          <div className="change-profile-buttons-row">
            <button 
              className="change-profile-choose-accounts-btn"
              onClick={() => setIsAccountModalOpen(true)}
            >
              <FiUsers size="1.2em" />
              {selectedGroup ? 
                selectedAccounts.find(g => g.accounts_name === selectedGroup)?.accounts_name : 
                'Choose Accounts'}
            </button>
            <button 
              className="change-profile-default-settings-btn"
              onClick={handleSetDefaultSettings}
            >
              <FiSettings size="1.2em" />
              Set Default Settings
            </button>
          </div>
          
          <div className="change-profile-buttons-row">
            <div className="change-profile-control-group">
              <div className="change-profile-control-label">Accounts Range</div>
              <div className="change-profile-range-inputs">
                <input 
                  type="number" 
                  className="change-profile-range-input"
                  placeholder="Start"
                  min="0"
                  value={range.start}
                  onChange={(e) => setRange(prev => ({ ...prev, start: parseInt(e.target.value) || 0 }))}
                />
                <input 
                  type="number" 
                  className="change-profile-range-input"
                  placeholder="End"
                  min="0"
                  value={range.end}
                  onChange={(e) => setRange(prev => ({ ...prev, end: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div className="change-profile-control-group">
              <div className="change-profile-control-label">Threads</div>
              <input 
                type="number" 
                className="change-profile-threads-input"
                min="1"
                value={threads}
                onChange={(e) => setThreads(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <button 
            className={`change-profile-start-btn ${isRunning ? 'change-profile-stop-btn' : ''}`}
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

        <div className="change-profile-content-section">
          <div className="change-profile-text-column">
            <button 
              className="change-profile-choose-module-btn"
              onClick={() => setIsModuleModalOpen(true)}
            >
              {selectedModule ? selectedModule.icon : <FiSettings size="1.2em" />}
              {selectedModule ? selectedModule.name : 'Choose Module'}
            </button>
            <button 
              className="change-profile-import-btn"
              onClick={handleImportData}
            >
              <FiUpload size="1.2em" />
              {selectedModule ? selectedModule.importText : 'Import Profile Data'}
            </button>
            <div className="change-profile-list-container">
              {profileData.map((item, index) => (
                <div key={index} className="change-profile-item">
                  <span>{item.displayName || item.value}</span>
                  <button 
                    className="change-profile-remove-btn" 
                    onClick={() => removeItem(index)}
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Progress 
          moduleId="change-profile-module" 
          ref={progressRef}
        />
      </div>

      <div className="change-profile-module-divider" />

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
        <div className="change-profile-logs-modal-overlay" onClick={() => setShowLogsModal(false)}>
          <div className="change-profile-logs-modal" onClick={e => e.stopPropagation()}>
            <div className="change-profile-logs-modal-header">
              <h3>Action Logs</h3>
              <button className="change-profile-close-modal-btn" onClick={() => setShowLogsModal(false)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="change-profile-logs-modal-content">
              {selectedLogs.map((log, index) => (
                <div key={index} className="change-profile-log-entry">{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isAccountModalOpen && (
        <div className="change-profile-account-select-overlay" onClick={() => setIsAccountModalOpen(false)}>
          <div className="change-profile-account-select-container" onClick={e => e.stopPropagation()}>
            <div className="change-profile-accounts-header">
              <h2>Select Account Group</h2>
              <button className="change-profile-close-modal-btn" onClick={() => setIsAccountModalOpen(false)}>
                <FiX size={24} />
              </button>
            </div>
            <div className="change-profile-accounts-divider" />
            <div className="change-profile-accounts-groups">
              {selectedAccounts.map(group => (
                <div 
                  key={group.accounts_name} 
                  className={`change-profile-group-container ${selectedGroup === group.accounts_name ? 'active' : ''}`}
                  onClick={() => handleGroupSelect(group.accounts_name)}
                >
                  <div className="change-profile-group-content">
                    <FiTwitter size={24} color="#1DA1F2" />
                    <h3 className="change-profile-group-name">{group.accounts_name}</h3>
                    <span className="change-profile-accounts-count">
                      {group.accounts.length} Accounts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isModuleModalOpen && (
        <div className="change-profile-module-select-overlay" onClick={() => setIsModuleModalOpen(false)}>
          <div className="change-profile-module-select-container" onClick={e => e.stopPropagation()}>
            <div className="change-profile-module-header">
              <h2>Select Module</h2>
              <button className="change-profile-close-modal-btn" onClick={() => setIsModuleModalOpen(false)}>
                <FiX size={24} />
              </button>
            </div>
            <div className="change-profile-module-divider" />
            <div className="change-profile-modules-list">
              {availableModules.map(module => (
                <div 
                  key={module.name} 
                  className={`change-profile-module-item ${selectedModule?.name === module.name ? 'active' : ''}`}
                  onClick={() => handleModuleSelect(module)}
                >
                  <div className="change-profile-module-item-content">
                    {module.icon}
                    <span className="change-profile-module-name">{module.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Toast 
        message="Please add at least one profile data item."
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

export default ChangeProfile; 