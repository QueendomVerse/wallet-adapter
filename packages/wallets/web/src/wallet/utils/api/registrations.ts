// import { StatusCodes } from 'http-status-codes';
import { apiHost } from '.';
import { emptyProfile, Profile } from './profiles';

export const getRegisteration = async (email: string) => {
  const fetchUrl = new URL(
    `${apiHost.pathname}/registeration/${email}`,
    apiHost,
  );
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    console.debug(`Registering email('${email}'): '${response.status}'`);

    return response.ok ? ((await response.json()) as Profile) : emptyProfile;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return emptyProfile; //@TODO: as opposed to null?
  }
};
