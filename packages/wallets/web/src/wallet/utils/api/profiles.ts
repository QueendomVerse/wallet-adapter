// import { StatusCodes } from 'http-status-codes';
import { Profile as lProfile } from '../../store/types/webWalletTypes';
import { apiHost } from '.';

export interface Profile extends lProfile {
  createdAt: string;
  updatedAt: string;
}

export interface Profiles extends Object {
  data: Profile[];
}

export const emptyProfile: Profile = {
  id: '',
  name: '',
  url: '',
  bio: '',
  twitter: '',
  site: '',
  email: '',
  avatarUrl: '',
  walletAddress: '',
  createdAt: '',
  updatedAt: '',
};

export const createProfile = async (
  name?: string,
  url?: string,
  bio?: string,
  twitter?: string,
  site?: string,
  email?: string,
  avatarUrl?: string,
  address?: string,
) => {
  const fetchUrl = new URL(`${apiHost.pathname}/profiles/saveProfile`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      method: 'POST',
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        url: url,
        bio: bio,
        twitter: twitter,
        site: site,
        email: email,
        avatarUrl: avatarUrl,
        walletAddress: address,
      }),
    });
    console.table(
      JSON.stringify({
        name: name,
        url: url,
        bio: bio,
        twitter: twitter,
        site: site,
        email: email,
        avatarUrl: avatarUrl,
        walletAddress: address,
      }),
    );

    console.debug(`Creating Profile('${email}'): '${response.status}'`);
    return response.ok
      ? ((await response.json()) as Profile)
      : emptyProfile ?? emptyProfile;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return emptyProfile;
  }
};

export const getProfileByAddress = async (address: string) => {
  const fetchUrl = new URL(
    `${apiHost.pathname}/profiles/byAddress/${address}`,
    apiHost,
  );
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    console.debug(`Getting profile('${address}'): '${response.status}'`);

    console.debug(`Creating user('${address}'): '${response.status}'`);
    return response.ok ? ((await response.json()) as Profile) : emptyProfile;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return emptyProfile;
  }
};

export const getProfileByEmail = async (email: string) => {
  const fetchUrl = new URL(
    `${apiHost.pathname}/profiles/byEmail/${email}`,
    apiHost,
  );
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    console.debug(`Getting profile('${email}'): '${response.status}'`);

    console.debug(`Creating user('${email}'): '${response.status}'`);
    return response.ok ? ((await response.json()) as Profile) : emptyProfile;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return emptyProfile;
  }
};
