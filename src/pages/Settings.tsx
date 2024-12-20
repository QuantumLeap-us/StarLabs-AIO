import { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/settings';
import "./Settings.css";
import Toast from '../components/common/Toast';

interface Config {
  take_data_random: boolean;
  max_tasks_retries: number;
  pause_between_tasks: number[];
  pause_between_accounts: number[];
}

interface ScraperConfig {
  scrape_bios: boolean;
  scrape_profile_pictures: boolean;
  scrape_backgrounds: boolean;
  scrape_names: boolean;
  scrape_ids: boolean;
  scrape_usernames: boolean;
  use_proxy_for_downloading_pictures: boolean;
  only_verified_accounts: boolean;
  minimum_followers: number;
  minimum_followings: number;
  minimum_favourites: number;
  minimum_tweets: number;
}

const Settings = () => {
  const [config, setConfig] = useState<Config>({
    take_data_random: true,
    max_tasks_retries: 3,
    pause_between_tasks: [3, 5],
    pause_between_accounts: [3, 5]
  });

  const [scraperConfig, setScraperConfig] = useState<ScraperConfig>({
    scrape_bios: true,
    scrape_profile_pictures: true,
    scrape_backgrounds: true,
    scrape_names: true,
    scrape_ids: true,
    scrape_usernames: true,
    use_proxy_for_downloading_pictures: true,
    only_verified_accounts: false,
    minimum_followers: 0,
    minimum_followings: 0,
    minimum_favourites: 0,
    minimum_tweets: 0
  });

  const { SERVER_URL, API_ENDPOINTS } = API_CONFIG;

  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const configResponse = await fetch(`${SERVER_URL}${API_ENDPOINTS.CONFIG}`);
        const scraperConfigResponse = await fetch(`${SERVER_URL}${API_ENDPOINTS.SCRAPER_CONFIG}`);

        if (configResponse.ok) {
          const configData = await configResponse.json();
          setConfig(configData);
        }

        if (scraperConfigResponse.ok) {
          const scraperData = await scraperConfigResponse.json();
          setScraperConfig(scraperData);
        }
      } catch (error) {
        console.error('Failed to fetch configs:', error);
      }
    };

    fetchConfigs();
  }, []);

  const saveConfigs = async () => {
    try {
      const configResponse = await fetch(`${SERVER_URL}${API_ENDPOINTS.CONFIG_UPDATE}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const scraperConfigResponse = await fetch(`${SERVER_URL}${API_ENDPOINTS.SCRAPER_CONFIG_UPDATE}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scraperConfig),
      });

      if (configResponse.ok && scraperConfigResponse.ok) {
        setShowToast(true);
      }
    } catch (error) {
      console.error('Failed to save configs:', error);
    }
  };

  return (
    <div className="settings-page">
      <Toast 
        message="Settings saved successfully"
        isVisible={showToast}
        onHide={() => setShowToast(false)}
      />
      <div className="settings-container">
        <div className="settings-header">
          <h2 className="settings-title">Base settings</h2>
        </div>
        <div className="settings-divider"></div>
        
        <div className="settings-group">
          <div className="setting-item">
            <label>Maximum number of attempts</label>
            <input
              type="number"
              value={config.max_tasks_retries}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                max_tasks_retries: Number(e.target.value)
              }))}
              min="1"
              className="setting-input"
            />
          </div>

          <div className="setting-item">
            <label>Pause between attempts in seconds</label>
            <div className="range-inputs">
              <div className="range-input-group">
                <span>Start</span>
                <input
                  type="number"
                  value={config.pause_between_tasks[0]}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    pause_between_tasks: [Number(e.target.value), prev.pause_between_tasks[1]]
                  }))}
                  min="0"
                  className="setting-input"
                />
              </div>
              <div className="range-input-group">
                <span>End</span>
                <input
                  type="number"
                  value={config.pause_between_tasks[1]}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    pause_between_tasks: [prev.pause_between_tasks[0], Number(e.target.value)]
                  }))}
                  min="0"
                  className="setting-input"
                />
              </div>
            </div>
          </div>

          <div className="setting-item">
            <label>Pause between accounts in seconds</label>
            <div className="range-inputs">
              <div className="range-input-group">
                <span>Start</span>
                <input
                  type="number"
                  value={config.pause_between_accounts[0]}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    pause_between_accounts: [Number(e.target.value), prev.pause_between_accounts[1]]
                  }))}
                  min="0"
                  className="setting-input"
                />
              </div>
              <div className="range-input-group">
                <span>End</span>
                <input
                  type="number"
                  value={config.pause_between_accounts[1]}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    pause_between_accounts: [prev.pause_between_accounts[0], Number(e.target.value)]
                  }))}
                  min="0"
                  className="setting-input"
                />
              </div>
            </div>
          </div>

          <div className="setting-item">
            <label>Take data to edit accounts in random order</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="random-order"
                checked={!config.take_data_random}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  take_data_random: !e.target.checked
                }))}
                className="toggle-input"
              />
              <label htmlFor="random-order" className="toggle-label">
                <span className="toggle-button"></span>
                <span className={`toggle-text yes ${!config.take_data_random ? 'active' : ''}`}>Yes</span>
                <span className={`toggle-text no ${config.take_data_random ? 'active' : ''}`}>No</span>
              </label>
            </div>
          </div>
        </div>

        <h2 className="settings-title" style={{ marginTop: '40px' }}>Scraper settings</h2>
        <div className="settings-divider"></div>
        
        <div className="settings-group">
          <div className="scraper-settings-grid">
            {[
              { key: 'scrape_profile_pictures', label: 'Profile Pictures' },
              { key: 'scrape_backgrounds', label: 'Background Pictures' },
              { key: 'scrape_names', label: 'Names' },
              { key: 'scrape_bios', label: 'Bios' },
              { key: 'scrape_ids', label: 'User IDs' },
              { key: 'scrape_usernames', label: 'Usernames' },
            ].map(({ key, label }) => (
              <div className="scraper-setting-item" key={key}>
                <span className="scraper-setting-label">{label}</span>
                <label className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={scraperConfig[key as keyof ScraperConfig] as boolean}
                    onChange={(e) => setScraperConfig(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                  />
                  <span className="checkmark"></span>
                </label>
              </div>
            ))}
          </div>

          <div className="setting-item">
            <label>Use proxies for downloading profile pictures</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="proxy-profiles"
                checked={!scraperConfig.use_proxy_for_downloading_pictures}
                onChange={(e) => setScraperConfig(prev => ({
                  ...prev,
                  use_proxy_for_downloading_pictures: !e.target.checked
                }))}
                className="toggle-input"
              />
              <label htmlFor="proxy-profiles" className="toggle-label">
                <span className="toggle-button"></span>
                <span className={`toggle-text yes ${!scraperConfig.use_proxy_for_downloading_pictures ? 'active' : ''}`}>Yes</span>
                <span className={`toggle-text no ${scraperConfig.use_proxy_for_downloading_pictures ? 'active' : ''}`}>No</span>
              </label>
            </div>
          </div>

          {[
            { key: 'minimum_followers', label: 'Minimum followers count' },
            { key: 'minimum_followings', label: 'Minimum followings count' },
            { key: 'minimum_favourites', label: 'Minimum favourites count' },
            { key: 'minimum_tweets', label: 'Minimum tweets count' },
          ].map(({ key, label }) => (
            <div className="setting-item" key={key}>
              <label>{label}</label>
              <input
                type="number"
                value={scraperConfig[key as keyof ScraperConfig] as number}
                onChange={(e) => setScraperConfig(prev => ({
                  ...prev,
                  [key]: Number(e.target.value)
                }))}
                min="0"
                className="setting-input"
              />
            </div>
          ))}

          <div className="setting-item">
            <label>Only verified accounts</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="verified-only"
                checked={!scraperConfig.only_verified_accounts}
                onChange={(e) => setScraperConfig(prev => ({
                  ...prev,
                  only_verified_accounts: !e.target.checked
                }))}
                className="toggle-input"
              />
              <label htmlFor="verified-only" className="toggle-label">
                <span className="toggle-button"></span>
                <span className={`toggle-text yes ${!scraperConfig.only_verified_accounts ? 'active' : ''}`}>Yes</span>
                <span className={`toggle-text no ${scraperConfig.only_verified_accounts ? 'active' : ''}`}>No</span>
              </label>
            </div>
          </div>
        </div>

        <div className="save-button-container">
          <button onClick={saveConfigs} className="save-button">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 