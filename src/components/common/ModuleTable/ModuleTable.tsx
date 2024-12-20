import './ModuleTable.css';

export type AccountStatus = 'IDLE' | 'PROCESS...' | 'SUCCESS' | 'FAILED' | 'ERROR' | 'ACTIVE';

interface Account {
  token: string;
  proxy: string;
  username: string;
  status: AccountStatus;
  logs: string[];
}

interface ModuleTableProps {
  accounts: Account[];
  onStatusClick: (logs: string[]) => void;
  onStatusChange?: (index: number, status: AccountStatus) => void;
}

const ModuleTable = ({ accounts, onStatusClick}: ModuleTableProps) => {
  return (
    <div className="module-table">
      <div className="module-table-header">
        <div className="module-table-header-cell">TOKEN</div>
        <div className="module-table-header-cell">PROXY</div>
        <div className="module-table-header-cell">USERNAME</div>
        <div className="module-table-header-cell">STATUS</div>
      </div>
      <div className="module-table-body">
        {accounts.map((account, index) => (
          <div key={index} className="module-table-row">
            <div className="module-table-cell">{account.token}</div>
            <div className="module-table-cell">{account.proxy}</div>
            <div className="module-table-cell">{account.username}</div>
            <div className="module-table-cell">
              <div 
                className={`status-block ${account.status ? account.status.toLowerCase().replace('...', '') : 'unknown'}`}
                onClick={() => {
                  if (account.status !== 'ACTIVE' && account.logs) {
                    onStatusClick(account.logs);
                  }
                }}
              >
                {account.status || 'UNKNOWN'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleTable;