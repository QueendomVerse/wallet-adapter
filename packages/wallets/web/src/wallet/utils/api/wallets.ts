import { StatusCodes } from 'http-status-codes';
import {
  Wallet as lWallet,
  Transaction as lTransaction,
} from '../../store/types/webWalletTypes';
import { apiHost } from '.';
// import bodyParser from 'body-parser';
// import { UserDeleteOutlined } from '@ant-design/icons';

export interface Wallet extends lWallet {
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallets extends Object {
  data: Wallet[];
}

export const emptyWallet: Wallet = {
  userId: '',
  chain: '',
  label: '',
  pubKey: '',
  encryptedSeedPhrase: '',
  encryptedPrivKey: '',
  balance: 0,
  createdAt: '',
  updatedAt: '',
};

export const emptyWallets: Wallets = {
  data: [emptyWallet],
};

// Create a new backend wallet (wallet.id is backend generated).
export const createWallet = async (
  userId: string,
  chain: string,
  label: string,
  pubKey: string,
  encryptedSeedPhrase: string = '',
  encryptedPrivKey: string = '',
  balance: number,
  transactions?: lTransaction[],
) => {
  const fetchUrl = new URL(`${apiHost.pathname}/wallets`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const found = await findOneWalletByAddress(pubKey);
    if (found) {
      throw new Error(`Wallet '${pubKey}' already exists!`);
    }
  } catch (e) {
    console.debug(e);
  }

  try {
    const response = await fetch(fetchUrl.toString(), {
      method: 'POST',
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        chain: chain,
        label: label,
        pubKey: pubKey,
        encryptedSeedPhrase: encryptedSeedPhrase,
        encryptedPrivKey: encryptedPrivKey,
        balance: balance,
        transactions: transactions,
      }),
    });
    console.debug(`Wallet('${pubKey}'): created '${response.status}'`);

    const data = await response.json();
    return response.ok ? (data as Wallet) : (data as Wallet) ?? emptyWallet;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return emptyWallet;
  }
};

export const removeWallet = async (id: string) => {
  const fetchUrl = new URL(`${apiHost.pathname}/wallets/remove/${id}`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      method: 'POST',
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: id }),
    });
    console.debug(`Removing wallet id('${id}'): '${response.status}'`);

    return response.status;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};

export const findWallets = async () => {
  const fetchUrl = new URL(`${apiHost.pathname}/wallets`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);
  try {
    const response = await fetch(fetchUrl.toString(), {
      //@TODO: enabling mode here and perhaps in other functions interferes with account creation
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    console.debug(
      `Pulling wallet data: '${response.ok ? 'success' : response.status}'`,
    );

    const data: Wallets = response.ok ? await response.json() : null;
    return data?.data;
  } catch (err) {
    throw new Error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
  }
};

export const removeWallets = async () => {
  const fetchUrl = new URL(`${apiHost.pathname}/wallets`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);
  try {
    const response = await fetch(fetchUrl.toString(), {
      method: 'delete',
      //@TODO: enabling mode here and perhaps in other functions interferes with account creation
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    console.debug(
      `Dropped wallet data: '${response.ok ? 'success' : response.status}'`,
    );

    const data: Wallets = response.ok ? await response.json() : null;
    console.info('data');
    console.dir(data);
    return data?.data;
  } catch (err) {
    throw new Error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
  }
};

export const findOneWalletById = async (id: string) => {
  const fetchUrl = new URL(`${apiHost.pathname}/wallets/${id}`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    console.debug(`Finding wallet('${id}'): '${response.status}'`);

    if (!response.ok) return;

    //@TODO: randomly throws "'SyntaxError: Unexpected end of JSON input'"; execution too quick?
    // if (response.ok) {
    const result = (await response.json()) as Wallet;
    console.debug('findOneWalletById: raw wallet: ');
    console.dir(result);
    return result;
    // };
    // return response.ok ? ((await response.json()) as Wallet) : null;
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.warn(
        `Does '${fetchUrl.toString()}' contain json formated data?'`,
      );
      return;
    }
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
  }
};

export const findOneWalletByAddress = async (address: string) => {
  const fetchUrl = new URL(
    `${apiHost.pathname}/wallets/byAddress/${address}`,
    apiHost,
  );
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    console.debug(`Finding wallet('${address}'): '${response.status}'`);

    if (!response.ok) return;

    //@TODO: randomly throws "'SyntaxError: Unexpected end of JSON input'"; execution too quick?
    // if (response.ok) {
    const result = (await response.json()) as Wallet;
    console.debug('findOneWalletByAddress: raw wallet: ');
    console.dir(result);
    return result;
    // };
    // return response.ok ? ((await response.json()) as Wallet) : null;
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.warn(
        `Does '${fetchUrl.toString()}' contain json formated data?'`,
      );
      return;
    }
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
  }
};

export const findOneWalletByUserId = async (userId: string) => {
  const fetchUrl = new URL(
    `${apiHost.pathname}/wallets/byUser/${userId}`,
    apiHost,
  );
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    console.debug(`Finding wallet('${userId}'): '${response.status}'`);

    if (!response.ok) return;

    //@TODO: randomly throws "'SyntaxError: Unexpected end of JSON input'"; execution too quick?
    // if (response.ok) {
    const result = (await response.json()) as Wallet;
    console.debug('findOneUserByUserId: raw wallet: ');
    console.dir(result);
    return result;
    // };
    // return response.ok ? ((await response.json()) as Wallet) : null;
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.warn(
        `Does '${fetchUrl.toString()}' contain json formated data?'`,
      );
      return;
    }
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
  }
};

export const updateUserId = async (address: string, userId: string) => {
  const fetchUrl = new URL(`${apiHost.pathname}/wallets/updateUserId`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      method: 'POST',
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pubKey: address, userId: userId }),
    });
    console.debug(`Updating UserId('${address}')`);

    return response.ok ?? response.status;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};

export const updateLabel = async (address: string, label: string) => {
  const fetchUrl = new URL(`${apiHost.pathname}/wallets/updateLabel`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      method: 'POST',
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pubKey: address, label: label }),
    });
    console.debug(`Updating UserId('${address}')`);

    return response.ok ?? response.status;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};

export const updateBalance = async (address: string, balance: number) => {
  const fetchUrl = new URL(
    `${apiHost.pathname}/wallets/updateBalance`,
    apiHost,
  );
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      method: 'POST',
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pubKey: address, balance: balance }),
    });
    console.debug(`Updating balance ('${address}')`);

    return response.ok ?? response.status;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};

export const updateTransactions = async (
  address: string,
  transactions: lTransaction[],
) => {
  const fetchUrl = new URL(
    `${apiHost.pathname}/wallets/updateTransactions`,
    apiHost,
  );
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      method: 'POST',
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pubKey: address, transactions: transactions }),
    });
    console.debug(`Updating transactions('${address}')'`);

    return response.ok ?? response.status;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};
