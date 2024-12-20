import type {
    WalletAccount,
    WalletBase,
    TokenData,
    NFTData,
    PoolData,
} from "../types";

class WalletCheckerAPI {
    private readonly BASE_URL = "http://localhost:4003";

    async getAllWalletBases(): Promise<WalletBase[]> {
        try {
            const response = await fetch(`${this.BASE_URL}/accounts/all`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("📡 Response data:", data);
            return data || ([] as WalletBase[]);
        } catch (error) {
            console.error("Error fetching wallet bases:", error);
            throw error;
        }
    }

    async createWalletBase(
        name: string,
        accounts: WalletAccount[]
    ): Promise<void> {
        try {
            const requestData = {
                accounts_name: name,
                accounts: accounts.map((acc) => ({
                    account_data: acc.account_data,
                    address: "0x", // значение по умолчанию
                    balance: 0, // значение по умолчанию
                    proxy: Array.isArray(acc.proxy) ? acc.proxy : [acc.proxy],
                    tokens: { quantity: 0, data: [] } as TokenData,
                    nfts: { quantity: 0, data: [] } as NFTData,
                    pools: { quantity: 0, data: [] } as PoolData,
                    last_check: 0,
                })),
            };

            console.log("Creating wallet base with data:", requestData);

            const response = await fetch(`${this.BASE_URL}/accounts/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `HTTP error! status: ${response.status}, message: ${errorText}`
                );
            }

            const result = await response.json();
            console.log("Create base response:", result);
        } catch (error) {
            console.error("Error creating wallet base:", error);
            throw error;
        }
    }

    async deleteWalletBase(id: string): Promise<void> {
        try {
            const response = await fetch(`${this.BASE_URL}/accounts/delete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error("Error deleting wallet base:", error);
            throw error;
        }
    }

    async updateWalletBase(
        id: string,
        updates: Partial<WalletBase>
    ): Promise<WalletBase> {
        try {
            const response = await fetch(`${this.BASE_URL}/accounts/replace`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id, ...updates }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error updating wallet base:", error);
            throw error;
        }
    }

    async deleteBase(name: string): Promise<void> {
        try {
            const response = await fetch(
                `${this.BASE_URL}/accounts/delete?name=${name}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error("Error deleting wallet base:", error);
            throw error;
        }
    }

    async replaceBase(
        baseName: string,
        accounts: WalletAccount[]
    ): Promise<void> {
        try {
            const requestData = {
                base_name: baseName,
                accounts: accounts.map((acc) => ({
                    account_data: acc.account_data,
                    address: acc.address || "0x",
                    balance: acc.balance || 0,
                    proxy: acc.proxy,
                    tokens: acc.tokens || { quantity: 0, data: [] },
                    nfts: acc.nfts || { quantity: 0, data: [] },
                    pools: acc.pools || { quantity: 0, data: [] },
                    last_check: acc.last_check || 0,
                })),
            };

            console.log("Sending request with data:", requestData);

            const response = await fetch(`${this.BASE_URL}/accounts/replace`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `HTTP error! status: ${response.status}, message: ${errorText}`
                );
            }

            const result = await response.json();
            console.log("Replace base response:", result);
        } catch (error) {
            console.error("Error updating wallet base:", error);
            throw error;
        }
    }
}

export const walletCheckerAPI = new WalletCheckerAPI();
