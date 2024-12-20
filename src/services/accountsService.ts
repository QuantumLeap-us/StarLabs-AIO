import { API_CONFIG } from "../config/settings";

export interface AccountData {
    token: string;
    proxy: string;
    status: string;
    username?: string;
    logs?: string[];
}

export interface AccountsBase {
    accounts_name: string;
    accounts: AccountData[];
}

interface CheckValidResponse {
    status: boolean;
    data?: {
        username: string;
        creation_date: string;
    };
    logs: string[];
    error_type?: string;
}

const accountsService = {
    getAllBases: async (): Promise<AccountsBase[]> => {
        const response = await fetch(
            `${API_CONFIG.SERVER_URL}${API_CONFIG.API_ENDPOINTS.ACCOUNTS_ALL}`
        );
        if (!response.ok) throw new Error("Failed to fetch accounts");
        return response.json();
    },

    createBase: async (base: AccountsBase): Promise<void> => {
        const response = await fetch(
            `${API_CONFIG.SERVER_URL}${API_CONFIG.API_ENDPOINTS.ACCOUNTS_CREATE}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accounts_name: base.accounts_name,
                    accounts: base.accounts.map(account => ({
                        token: account.token,
                        proxy: account.proxy,
                        status: account.status,
                        username: account.username,
                        logs: account.logs
                    }))
                }),
            }
        );
        if (!response.ok) throw new Error("Failed to create account base");
    },

    deleteBase: async (name: string): Promise<void> => {
        const response = await fetch(
            `${API_CONFIG.SERVER_URL}${API_CONFIG.API_ENDPOINTS.ACCOUNTS_DELETE}?name=${name}`,
            {
                method: "DELETE",
            }
        );
        if (!response.ok) throw new Error("Failed to delete account base");
    },

    editAccount: async (
        baseName: string,
        accountData: AccountData,
        index: number
    ): Promise<void> => {
        const response = await fetch(
            `${API_CONFIG.SERVER_URL}${API_CONFIG.API_ENDPOINTS.ACCOUNTS_EDIT}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    base_name: baseName,
                    account_data: accountData,
                    index,
                }),
            }
        );
        if (!response.ok) throw new Error("Failed to edit account");
    },

    deleteAccount: async (baseName: string, index: number): Promise<void> => {
        const response = await fetch(
            `${API_CONFIG.SERVER_URL}${API_CONFIG.API_ENDPOINTS.ACCOUNTS_DELETE_ACCOUNT}`,
            {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    base_name: baseName,
                    index,
                }),
            }
        );
        if (!response.ok) throw new Error("Failed to delete account");
    },

    replaceBase: async (
        baseName: string,
        accounts: AccountData[]
    ): Promise<void> => {
        const response = await fetch(
            `${API_CONFIG.SERVER_URL}${API_CONFIG.API_ENDPOINTS.ACCOUNTS_EDIT}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    base_name: baseName,
                    accounts: accounts,
                }),
            }
        );
        if (!response.ok) throw new Error("Failed to update account base");
    },

    checkValid: async (token: string, proxy: string): Promise<CheckValidResponse> => {
        const response = await fetch(
            `${API_CONFIG.SERVER_URL}${API_CONFIG.API_ENDPOINTS.CHECK_SUSPENDED}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ auth_token: token, proxy })
            }
        );
        if (!response.ok) throw new Error('Failed to check account');
        return response.json();
    }
};

export default accountsService;
