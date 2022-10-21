export * from "./items";
export * from "./profiles";
export * from "./registrations";
export * from "./users";
export * from "./wallets";

import getConfig from "next/config";

//@TODO Add API connection checks and user notifications for all calls?

const { publicRuntimeConfig } = getConfig();

export type ApiResponse = {
  data: string;
  path: string;
};

export const apiHost = new URL(publicRuntimeConfig.apiUrl);

export const getHealth = async () => {
  const fetchUrl = new URL(`${apiHost.pathname}/health`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);
  try {
    const response = await fetch(fetchUrl.toString(), {
      //@TODO: enabling mode here and perhaps in other functions interferes with account creation
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    console.debug(
      `API connection ${apiHost}: '${
        response.ok ? "success" : response.status
      }'`
    );

    return response.ok ? true : false;
  } catch (err) {
    throw new Error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
  }
};
