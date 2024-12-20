import { useState, useEffect } from "react";
import { FiUpload, FiX, FiCheck, FiAlertCircle } from "react-icons/fi";
import "./CreateGroupModal.css";

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateGroup: (groupName: string, accounts: string[], proxies: string[]) => void;
    editMode?: boolean;
    initialData?: {
        name: string;
        accounts: {
            token: string;
            proxy: string;
            status: string;
        }[];
    } | null;
}

const CreateGroupModal = ({ 
    isOpen, 
    onClose, 
    onCreateGroup, 
    editMode = false,
    initialData = null 
}: CreateGroupModalProps) => {
    const [groupName, setGroupName] = useState("");
    const [groupNameError, setGroupNameError] = useState("");
    const [accounts, setAccounts] = useState<string[]>([]);
    const [proxies, setProxies] = useState<string[]>([]);
    const [accountInput, setAccountInput] = useState("");
    const [proxyInput, setProxyInput] = useState("");
    const [fillProxies, setFillProxies] = useState(true);

    useEffect(() => {
        if (editMode && initialData) {
            setGroupName(initialData.name);
            setAccounts(initialData.accounts.map(acc => acc.token));
            setProxies(initialData.accounts.map(acc => acc.proxy));
        } else if (!isOpen) {
            setGroupName("");
            setAccounts([]);
            setProxies([]);
        }
    }, [editMode, initialData, isOpen]);

    const modalTitle = editMode ? "Edit Account Group" : "Create New Account Group";
    const submitButtonText = editMode ? "Save Changes" : "Create Group";

    const handleAccountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAccountInput(value);

        if (value.includes(' ')) {
            const newAccounts = value
                .split(' ')
                .filter(acc => acc.trim() !== '')
                .map(acc => acc.trim());
            
            setAccounts(prev => [...new Set([...prev, ...newAccounts])]);
            setAccountInput('');
        }
    };

    const handleProxyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setProxyInput(value);

        if (value.includes(' ')) {
            const newProxies = value
                .split(' ')
                .filter(proxy => proxy.trim() !== '')
                .map(proxy => proxy.trim());
            
            setProxies(prev => [...new Set([...prev, ...newProxies])]);
            setProxyInput('');
        }
    };

    const handleFileImport = async (type: 'accounts' | 'proxies') => {
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

                if (type === 'accounts') {
                    setAccounts(prev => [...new Set([...prev, ...lines])]);
                } else {
                    setProxies(prev => [...new Set([...prev, ...lines])]);
                }
            };

            input.click();
        } catch (error) {
            console.error('Error importing file:', error);
        }
    };

    const validateGroupName = (name: string) => {
        if (!name.trim()) {
            setGroupNameError("Name cannot be empty");
            return false;
        }

        if (/^\d/.test(name)) {
            setGroupNameError("Name cannot start with a number");
            return false;
        }

        if (!/^[a-zA-Zа-яА-Я][a-zA-Zа-яА-Я0-9_]*$/.test(name)) {
            setGroupNameError("Name can only contain letters, numbers and underscore");
            return false;
        }

        setGroupNameError("");
        return true;
    };

    const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setGroupName(value.toLowerCase());
        validateGroupName(value);
    };

    const handleSubmit = () => {
        if (groupName.trim() === "") {
            setGroupNameError("Group name is required");
            return;
        }

        const filteredAccounts = accounts.filter(account => account.trim() !== "");
        const filteredProxies = proxies.filter(proxy => proxy.trim() !== "");

        onCreateGroup(groupName, filteredAccounts, filteredProxies);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="create-group-modal">
                <div className="modal-header">
                    <h3>{modalTitle}</h3>
                </div>
                
                <div className="modal-content">
                    <div className="group-name-section">
                        <label>Group name</label>
                        <div className="group-name-hint">
                            Use letters, numbers and underscore. Cannot start with a number.
                            Examples: accounts_123, my_accounts, twitter_group
                        </div>
                        <input
                            type="text"
                            value={groupName}
                            onChange={handleGroupNameChange}
                            placeholder="Enter group name"
                            className="group-name-input"
                        />
                        {groupNameError && (
                            <div className="group-name-error">{groupNameError}</div>
                        )}
                    </div>

                    <div className="group-sections-container">
                        <div className="group-section">
                            <button 
                                className="import-btn"
                                onClick={() => handleFileImport('accounts')}
                            >
                                <FiUpload size={16} />
                                Import Accounts
                            </button>
                            <input
                                type="text"
                                value={accountInput}
                                onChange={handleAccountInput}
                                placeholder="Enter accounts (space-separated)"
                                className="items-input-field"
                            />
                            <div className="items-list-container">
                                <div className="items-list">
                                    {accounts.map((account, index) => (
                                        <div key={index} className="item">
                                            <div className="item-content">
                                                <span className="item-number">[{index + 1}]</span>
                                                <span className="item-text">{account}</span>
                                            </div>
                                            <button 
                                                className="remove-item-btn"
                                                onClick={() => setAccounts(accounts.filter(a => a !== account))}
                                            >
                                                <FiX size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="group-section">
                            <button 
                                className="import-btn"
                                onClick={() => handleFileImport('proxies')}
                            >
                                <FiUpload size={16} />
                                Import Proxies
                            </button>
                            <input
                                type="text"
                                value={proxyInput}
                                onChange={handleProxyInput}
                                placeholder="Enter proxies (space-separated)"
                                className="items-input-field"
                            />
                            <div className="items-list-container">
                                <div className="items-list">
                                    {proxies.map((proxy, index) => (
                                        <div key={index} className="item">
                                            <div className="item-content">
                                                <span className="item-number">[{index + 1}]</span>
                                                <span className="item-text">{proxy}</span>
                                            </div>
                                            <button 
                                                className="remove-item-btn"
                                                onClick={() => setProxies(proxies.filter(p => p !== proxy))}
                                            >
                                                <FiX size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="proxy-fill-option">
                    <div className="proxy-fill-header">
                        <FiAlertCircle className="warning-icon" size={16} />
                        <span>Fill in proxies for all accounts?</span>
                        <div 
                            className={`checkbox ${fillProxies ? 'checked' : ''}`}
                            onClick={() => setFillProxies(!fillProxies)}
                        >
                            {fillProxies && <FiCheck size={14} />}
                        </div>
                    </div>
                    <p className="proxy-fill-description">
                        If you upload fewer proxies than accounts, the bot will automatically distribute proxies to all accounts.
                    </p>
                </div>

                <div className="modal-footer">
                    <button className="modal-btn cancel-btn" onClick={onClose}>
                        <FiX size={16} />
                        Cancel
                    </button>
                    <button className="modal-btn create-btn" onClick={handleSubmit}>
                        <FiCheck size={16} />
                        {submitButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal; 