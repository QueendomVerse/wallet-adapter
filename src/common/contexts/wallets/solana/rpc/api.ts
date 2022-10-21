// import { RpcMetadata } from '../types';
import { IMetadataExtension } from "../../../../actions";

export const fetchNftMetadata = async (tokenUrl: string) => {
  if (!tokenUrl) return;

  const url = new URL(tokenUrl);
  const fetchUrl = new URL(url.pathname, url.origin).href;
  // console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    //   console.debug(`Fetched token URL '${tokenUrl}': '${response.status}'`);

    const data = (await response.json()) as IMetadataExtension;
    return response.ok ? data : null;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return null;
  }
};
