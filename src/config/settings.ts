export const API_CONFIG = {
    SERVER_URL: 'http://localhost:8080',
    API_ENDPOINTS: {
      CONFIG: '/api/config',
      CONFIG_UPDATE: '/api/config/update',
      SCRAPER_CONFIG: '/api/scraper-config',
      SCRAPER_CONFIG_UPDATE: '/api/scraper-config/update',
      ACCOUNTS_CREATE: '/api/accounts/create',
      ACCOUNTS_ALL: '/api/accounts/all',
      ACCOUNTS_DELETE: '/api/accounts/delete',
      ACCOUNTS_EDIT: '/api/accounts/edit',
      ACCOUNTS_DELETE_ACCOUNT: '/api/accounts/delete-account',
      LIKE: '/api/like',
      UNLIKE: '/api/unlike',
      COMMENT: '/api/comment',
      VOTE: '/api/vote-poll',
      CHECK_SUSPENDED: '/api/check_suspended'
    }
  } as const;