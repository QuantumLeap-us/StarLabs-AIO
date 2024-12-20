import "./Accounts.css";
import "./AccountTable.css";
import { useState, useEffect } from "react";
import { FiTrash2, FiEdit2, FiTwitter, FiMessageCircle, FiCheck, FiCheckCircle, FiFilter, FiDownload, FiUserPlus, FiX, FiLock, FiHelpCircle } from "react-icons/fi";
import { FaRegFaceRollingEyes, FaSkull } from "react-icons/fa6";
import { FaQuestion, FaRegMeh } from "react-icons/fa";
import CreateGroupModal from "../components/modals/CreateGroupModal";
import ConfirmationModal from "../components/modals/ConfirmationModal";
import ExportAccountsModal from '../components/modals/ExportAccountsModal';
import accountsService, { AccountsBase, AccountData } from '../services/accountsService';
import Toast from "../components/common/Toast";
import LogsModal from '../components/modals/LogsModal';
import { TfiFaceSad } from "react-icons/tfi";
import FilterModal from '../components/modals/FilterModal';

type AccountStatus = 'active' | 'inactive' | 'error' | 'locked' | 'wrong token' | 'suspended';

const Accounts = () => {
    const [accountGroups, setAccountGroups] = useState<AccountsBase[]>([]);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
    const [groupToEdit, setGroupToEdit] = useState<AccountsBase | null>(null);
    const [editingAccount, setEditingAccount] = useState<{
        index: number;
        token: string;
        proxy: string;
        username?: string;
    } | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isToastVisible, setIsToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [checkedAccounts, setCheckedAccounts] = useState<AccountData[]>([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Fetch accounts on component mount
    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const bases = await accountsService.getAllBases();
            setAccountGroups(bases || []);
            if (bases && bases.length > 0 && !selectedGroup) {
                setSelectedGroup(bases[0].accounts_name);
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
            setAccountGroups([]);
        }
    };

    const handleGroupClick = (groupId: string) => {
        setSelectedGroup(groupId === selectedGroup ? null : groupId);
    };

    const getSelectedGroupAccounts = () => {
        const selectedGroupData = accountGroups.find(group => group.accounts_name === selectedGroup);
        return selectedGroupData?.accounts || [];
    };

    const handleDeleteClick = (groupId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setGroupToDelete(groupId);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (groupToDelete) {
            try {
                const group = accountGroups.find(g => g.accounts_name === groupToDelete);
                if (group) {
                    await accountsService.deleteBase(group.accounts_name);
                    await fetchAccounts(); // Refresh the list
                }
                setIsDeleteModalOpen(false);
                setGroupToDelete(null);
            } catch (error) {
                console.error('Failed to delete group:', error);
                // Add error handling/toast notification here
            }
        }
    };

    const handleCreateGroup = async (groupName: string, accounts: string[], proxies: string[]) => {
        try {
            const accountsData: AccountData[] = accounts
                .filter(token => token.trim() !== '')
                .map((token, index) => ({
                    token,
                    proxy: proxies.length === 1 ? proxies[0] : (proxies[index] || ''),
                    status: 'active'
                }));

            await accountsService.createBase({
                accounts_name: groupName,
                accounts: accountsData
            });

            await fetchAccounts();
            setIsCreateGroupModalOpen(false);
        } catch (error) {
            console.error('Failed to create group:', error);
        }
    };

    const handleEditClick = (group: AccountsBase) => {
        setGroupToEdit(group);
        setIsEditModalOpen(true);
    };

    const handleEditGroup = async (groupName: string, accounts: string[], proxies: string[]) => {
        try {
            if (!groupToEdit) return;

            const validAccounts: string[] = accounts.filter(token => token.trim() !== '');
            const accountsData: AccountData[] = validAccounts.map((token, index) => ({
                token,
                proxy: proxies.length === 1 ? proxies[0] : (proxies[index] || ''),
                status: 'active'
            }));

            if (groupName !== groupToEdit.accounts_name) {
                await accountsService.deleteBase(groupToEdit.accounts_name);
                await accountsService.createBase({
                    accounts_name: groupName,
                    accounts: accountsData
                });
            } else {
                await accountsService.createBase({
                    accounts_name: groupName,
                    accounts: accountsData
                });
            }

            await fetchAccounts();
            setIsEditModalOpen(false);
            setGroupToEdit(null);
        } catch (error) {
            console.error('Failed to edit group:', error);
        }
    };

    const handleDeleteAccount = async (groupId: string, accountIndex: number) => {
        try {
            const group = accountGroups.find(g => g.accounts_name === groupId);
            if (group) {
                await accountsService.deleteAccount(group.accounts_name, accountIndex);
                await fetchAccounts(); // Refresh the list
            }
        } catch (error) {
            console.error('Failed to delete account:', error);
            // Add error handling/toast notification here
        }
    };

    const handleEditAccount = (groupId: string, accountIndex: number) => {
        const group = accountGroups.find(g => g.accounts_name === groupId);
        if (group) {
            const account = group.accounts[accountIndex];
            setEditingAccount({
                index: accountIndex,
                token: account.token,
                proxy: account.proxy,
                username: account.username
            });
        }
    };

    const handleSaveEdit = async (groupId: string) => {
        if (editingAccount) {
            try {
                const group = accountGroups.find(g => g.accounts_name === groupId);
                if (group) {
                    await accountsService.editAccount(
                        group.accounts_name,
                        {
                            token: editingAccount.token,
                            proxy: editingAccount.proxy,
                            username: editingAccount.username,
                            status: 'active'
                        },
                        editingAccount.index
                    );
                    await fetchAccounts(); // Refresh the list
                }
                setEditingAccount(null);
            } catch (error) {
                console.error('Failed to edit account:', error);
                // Add error handling/toast notification here
            }
        }
    };

    const getSelectedGroup = () => {
        return accountGroups.find(group => group.accounts_name === selectedGroup);
    };

    const showToast = (message: string) => {
        setToastMessage(message);
        setIsToastVisible(true);
    };

    const handleStatusClick = (logs: string[] | undefined) => {
        setSelectedLogs(logs || []);
        setIsLogsModalOpen(true);
    };

    const handleCheckValid = async () => {
        if (!selectedGroup) {
            showToast('Please select an account group first');
            return;
        }

        const accounts = getSelectedGroupAccounts();
        if (accounts.length === 0) {
            showToast('No accounts to check');
            return;
        }

        // Проверяем каждый аккаунт
        const updatedAccounts = [...accounts];
        for (let i = 0; i < accounts.length; i++) {
            try {
                const response = await accountsService.checkValid(
                    accounts[i].token,
                    accounts[i].proxy
                );

                console.log('Response from server:', response); // Проверяем ответ сервера

                let status = 'active';
                let logs = [...(response.logs || [])];
                
                console.log('Initial logs:', logs); // Провеяем начальные логи

                // Определяем статус на основе ответа
                if (!response.status) {
                    let errorType = response.error_type?.toLowerCase()
                    switch (errorType) {
                        case 'locked':
                            status = 'locked' as AccountStatus;
                            break;
                        case 'unauthenticated':
                            status = 'wrong token' as AccountStatus;
                            break;
                        case 'suspended':
                            status = 'suspended' as AccountStatus;
                            break;
                        default:
                            status = 'error' as AccountStatus;
                    }
                } else {
                    status = 'active' as AccountStatus;
                }

                // Добавляем информацию о creation_date в логи, если она есть
                if (response.data?.creation_date) {
                    logs.push(`Account creation date: ${response.data.creation_date}`);
                }

                console.log('Final logs before update:', logs); // Проверяем финальные логи

                // Обновляем аккаунт с новыми данными
                updatedAccounts[i] = {
                    ...accounts[i],
                    status: status,
                    username: response.data?.username || accounts[i].username,
                    logs: logs
                };

                console.log('Updated account:', updatedAccounts[i]); // Проверяем обновленный аккаунт

            } catch (error) {
                console.error('Failed to check account:', error);
                updatedAccounts[i] = {
                    ...accounts[i],
                    status: 'error',
                    logs: ['Failed to check account: Network or server error']
                };
            }
        }

        setCheckedAccounts(updatedAccounts); // Сохраняем проверенные аккаунты

        // Обновляем группу аккаунтов с новыми статусами
        const group = accountGroups.find(g => g.accounts_name === selectedGroup);
        if (group) {
            try {
                await accountsService.createBase({
                    accounts_name: group.accounts_name,
                    accounts: updatedAccounts
                });
                // Вместо fetchAccounts используем сохраненные данные
                setAccountGroups(prev => prev.map(g => 
                    g.accounts_name === selectedGroup 
                        ? { ...g, accounts: updatedAccounts }
                        : g
                ));
                showToast('Accounts check completed');
            } catch (error) {
                console.error('Failed to update accounts:', error);
                showToast('Failed to update accounts status');
            }
        }
    };

    const handleFilter = async (selectedStatuses: string[]) => {
        if (!selectedGroup) return;

        const group = accountGroups.find(g => g.accounts_name === selectedGroup);
        if (!group) return;

        // Filter out accounts with selected statuses
        const filteredAccounts = group.accounts.filter(
            account => !selectedStatuses.includes(account.status)
        );

        // Update the group with filtered accounts
        try {
            await accountsService.createBase({
                accounts_name: group.accounts_name,
                accounts: filteredAccounts
            });
            await fetchAccounts();
            showToast('Accounts filtered successfully');
        } catch (error) {
            console.error('Failed to filter accounts:', error);
            showToast('Failed to filter accounts');
        }
    };

    return (
        <div className="accounts-page">
            <div className="accounts-container">
                <div className="accounts-header">
                    <div className="header-left">
                        <button className="header-btn" onClick={() => setIsCreateGroupModalOpen(true)}>
                            <FiUserPlus size={16} />
                            Create New Account Group
                        </button>
                        <button className="header-btn" onClick={() => setIsExportModalOpen(true)}>
                            <FiDownload size={16} />
                            Export
                        </button>
                    </div>
                    
                    <div className="header-right">
                        <button 
                            className="header-btn"
                            onClick={handleCheckValid}
                        >
                            <FiCheckCircle size={16} />
                            Check Valid
                        </button>
                        <button 
                            className="header-btn"
                            onClick={() => setIsFilterModalOpen(true)}
                        >
                            <FiFilter size={16} />
                            Filter
                        </button>
                    </div>
                </div>

                <div className="accounts-divider" />

                <div className="accounts-groups">
                    {accountGroups.length > 0 ? (
                        accountGroups.map(group => (
                            <div 
                                key={group.accounts_name} 
                                className={`group-container ${selectedGroup === group.accounts_name ? 'active' : ''}`}
                                onClick={() => handleGroupClick(group.accounts_name)}
                            >
                                <div className="group-header">
                                    <button 
                                        className="group-action-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditClick(group);
                                        }}
                                    >
                                        <FiEdit2 size={14} />
                                    </button>
                                    <button 
                                        className="group-action-btn"
                                        onClick={(e) => handleDeleteClick(group.accounts_name, e)}
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                                <div className="group-content">
                                    {group.accounts_name.includes('Twitter') ? 
                                        <FiTwitter size={24} color="#1DA1F2" /> : 
                                        <FiMessageCircle size={24} color="#5865F2" />
                                    }
                                    <h3 className="group-name">{group.accounts_name}</h3>
                                    <span className="accounts-count">
                                        {group.accounts.length} Accounts
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-groups-message">
                            No account groups available
                        </div>
                    )}
                </div>

                <div className="accounts-divider" />

                <div className="accounts-table-container">
                    {selectedGroup && getSelectedGroupAccounts().length > 0 ? (
                        <>
                            <div className="accounts-list-header">
                                <div className="accounts-list-cell">Token</div>
                                <div className="accounts-list-cell">Proxy</div>
                                <div className="accounts-list-cell">Status</div>
                                <div className="accounts-list-cell">Username</div>
                                <div className="accounts-list-cell">Action</div>
                            </div>
                            {getSelectedGroupAccounts().map((account, index) => (
                                <div key={index} className="accounts-list-row">
                                    <div className="accounts-list-item">
                                        {editingAccount?.index === index ? (
                                            <input
                                                type="text"
                                                value={editingAccount.token}
                                                onChange={(e) => setEditingAccount({
                                                    ...editingAccount,
                                                    token: e.target.value
                                                })}
                                                className="accounts-edit-input"
                                            />
                                        ) : (
                                            <span>{account.token}</span>
                                        )}
                                    </div>
                                    <div className="accounts-list-item">
                                        {editingAccount?.index === index ? (
                                            <input
                                                type="text"
                                                value={editingAccount.proxy}
                                                onChange={(e) => setEditingAccount({
                                                    ...editingAccount,
                                                    proxy: e.target.value
                                                })}
                                                className="accounts-edit-input"
                                            />
                                        ) : (
                                            <span>{account.proxy}</span>
                                        )}
                                    </div>
                                    <div className="accounts-list-item">
                                        <span 
                                            className={`status-badge status-${account.status.toLowerCase().replace(' ', '-')}`}
                                            onClick={() => {
                                                const checkedAccount = checkedAccounts.find(a => a.token === account.token);
                                                handleStatusClick(checkedAccount?.logs || account.logs);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                            title="Click to view logs"
                                        >
                                            {account.status === 'active' && <FiCheck className="status-icon" />}
                                            {account.status === 'error' && <FiX className="status-icon" />}
                                            {account.status === 'locked' && <FiLock className="status-icon" />}
                                            {account.status === 'wrong token' && <FaQuestion className="status-icon" />}
                                            {account.status === 'suspended' && <FaSkull className="status-icon" />}
                                            {account.status || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="accounts-list-item">
                                        {editingAccount?.index === index ? (
                                            <input
                                                type="text"
                                                value={editingAccount.username || ''}
                                                onChange={(e) => setEditingAccount({
                                                    ...editingAccount,
                                                    username: e.target.value
                                                })}
                                                className="accounts-edit-input"
                                                placeholder="Enter username"
                                            />
                                        ) : (
                                            <span>@{account.username || 'N/A'}</span>
                                        )}
                                    </div>
                                    <div className="accounts-list-item">
                                        {editingAccount?.index === index ? (
                                            <button 
                                                className="account-action-btn save"
                                                onClick={() => handleSaveEdit(selectedGroup!)}
                                            >
                                                <FiCheck size={14} />
                                            </button>
                                        ) : (
                                            <button 
                                                className="account-action-btn"
                                                onClick={() => handleEditAccount(selectedGroup!, index)}
                                            >
                                                <FiEdit2 size={14} />
                                            </button>
                                        )}
                                        <button 
                                            className="account-action-btn delete"
                                            onClick={() => handleDeleteAccount(selectedGroup!, index)}
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="no-accounts-message">
                            {selectedGroup 
                                ? "No accounts in this group" 
                                : "No account group selected"}
                        </div>
                    )}
                </div>
            </div>
            <CreateGroupModal 
                isOpen={isCreateGroupModalOpen}
                onClose={() => setIsCreateGroupModalOpen(false)}
                onCreateGroup={handleCreateGroup}
            />
            <CreateGroupModal 
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setGroupToEdit(null);
                }}
                onCreateGroup={handleEditGroup}
                editMode={true}
                initialData={groupToEdit ? {
                    name: groupToEdit.accounts_name,
                    accounts: groupToEdit.accounts
                } : null}
            />
            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Account Group"
                message="Are you sure you want to delete this account group? This action cannot be undone."
            />
            <ExportAccountsModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                groupName={getSelectedGroup()?.accounts_name || ''}
                accounts={getSelectedGroup()?.accounts || []}
            />
            <LogsModal 
                isOpen={isLogsModalOpen}
                onClose={() => setIsLogsModalOpen(false)}
                logs={selectedLogs}
            />
            <Toast 
                message={toastMessage}
                isVisible={isToastVisible}
                onHide={() => setIsToastVisible(false)}
            />
            <FilterModal 
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onFilter={handleFilter}
            />
        </div>
    );
};

export default Accounts;