import { StatusCodes } from 'http-status-codes';
import { Attribute, MetadataCategory } from 'common';
import { Item as lItem } from '../../store/types/webWalletTypes';
import { ArtType } from '../../types';
import { apiHost } from '.';

export interface Item extends lItem {
  createdAt: string;
  updatedAt: string;
}

export interface Items extends Object {
  data: Item[];
}

export const emptyItem: Item = {
  id: '',
  identifier: '',
  uri: '',
  image: '',
  artists: [],
  mint: '',
  link: '',
  external_url: '',
  title: '',
  seller_fee_basis_points: 0,
  creators: [],
  type: ArtType.NFT,
  category: MetadataCategory.Image,
  edition: 0,
  supply: 0,
  maxSupply: 0,
  solPrice: 0,
  description: '',
  story: '',
  attributes: [
    {
      trait_type: '',
      display_type: '',
      value: '', // or 0
    },
  ],
  files: [
    {
      uri: '',
      type: '',
    },
  ],
  chain: '',
  tokenMint: '',
  publicKey: '',
  createdAt: '',
  updatedAt: '',
};

export const emptyItems: Items = {
  data: [emptyItem],
};

export const createItem = async (item: lItem) => {
  const fetchUrl = new URL(`${apiHost.pathname}/items`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);
  try {
    const response = await fetch(fetchUrl.toString(), {
      method: 'POST',
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    console.table(JSON.stringify(item));

    console.debug(`Creating item('${item.id}'): '${response.status}'`);

    return response.ok
      ? ((await response.json()) as Item)
      : emptyItem ?? emptyItem;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return emptyItem;
  }
};

export const removeItem = async (id: string) => {
  const fetchUrl = new URL(`${apiHost.pathname}/items/remove/${id}`, apiHost);
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
    console.debug(`Removing item id('${id}'): '${response.status}'`);

    return response.status;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};

export const findItems = async () => {
  const fetchUrl = new URL(`${apiHost.pathname}/items`, apiHost);
  console.debug(`fetching url: ${fetchUrl.toString()}`);
  try {
    const response = await fetch(fetchUrl.toString(), {
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    // console.debug(`Pulling item data: '${response.status}'`);

    const data: Items = response.ok ? await response.json() : emptyItems;
    // console.table(data);
    return data.data ?? [emptyItem];
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return [emptyItem];
  }
};

export const findOneItem = async (tokenMint: string) => {
  const fetchUrl = new URL(
    `${apiHost.pathname}/items/byTokenMint/${tokenMint}`,
    apiHost,
  );
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    console.debug(`Finding item('${tokenMint}'): '${response.status}'`);

    return response.ok ? ((await response.json()) as Item) : emptyItem;
  } catch (err) {
    throw new Error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
  }
};

export const findOneItemByIdentifier = async (tokenIdentifier: string) => {
  const fetchUrl = new URL(
    `${apiHost.pathname}/items/byTokenIdentifier/${tokenIdentifier}`,
    apiHost,
  );
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    console.debug(`Finding item('${tokenIdentifier}'): '${response.status}'`);

    return response.ok ? ((await response.json()) as Item) : emptyItem;
  } catch (err) {
    throw new Error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
  }
};

export const updateItemPrice = async (id: string, solPrice: string) => {
  const fetchUrl = new URL(`${apiHost.pathname}/items/updatePrice`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      method: 'POST',
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ solPrice: solPrice, id: id }),
    });
    console.debug(
      `Updating item('${id}') price to '${solPrice}'): '${response.status}'`,
    );

    return response.status;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};

export const updateItemProperties = async (
  id: string,
  title: string,
  description: string,
  story: string,
  attributes: Attribute[],
) => {
  const fetchUrl = new URL(`${apiHost.pathname}/items/saveProperties`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);

  const updatedItem = {
    id: id,
    title: title,
    description: description,
    story: story,
    attributes: attributes,
  };

  try {
    const response = await fetch(fetchUrl.toString(), {
      method: 'POST',
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedItem),
    });
    console.table(JSON.stringify(updatedItem));

    console.debug(`Updating item('${id}') properties: '${response.status}'`);

    return response.status;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};
