import { StatusCodes } from "http-status-codes";
import {
  User as lUser,
  Wallet as lWallet,
} from "../../store/types/webWalletTypes";
import { apiHost, ApiResponse } from ".";

export interface User extends lUser {
  createdAt: string;
  updatedAt: string;
}

export interface Users extends Object {
  data: User[];
}

export const emptyUser: User = {
  id: "",
  name: "",
  email: "",
  role: "",
  walletAddress: "",
  image: "",
  avatar: "",
  banner: "",
  roles: [],
  settings: ["setting"],
  wallets: [],
  isSelected: false,
  createdAt: "",
  updatedAt: "",
};

export const emptyUsers: Users = {
  data: [emptyUser],
};

// Create a new backend user (user.id is backend generated).
export const createUser = async (
  name: string,
  email: string,
  address: string, // @TODO make changes and remove this to decouple from user
  encodedPassword: string = "",
  hashedPassword: string = "",
  roles: string[] = [],
  settings: string[] = [],
  wallets: lWallet[] = []
) => {
  const fetchUrl = new URL(`${apiHost.pathname}/users`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const found = await findOneUserByAddress(address);
    if (found) {
      throw new Error(`User '${address}' already exists!`);
    }
  } catch (e) {
    console.debug(e);
  }

  try {
    const response = await fetch(fetchUrl.toString(), {
      method: "POST",
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        email: email,
        walletAddress: address,
        roles: roles,
        settings: settings,
        wallets: wallets,
        encryptedPassword: encodedPassword,
        hashedPassword: hashedPassword,
      }),
    });
    console.debug(`User('${address}'): created '${response.status}'`);

    const data = await response.json();
    return response.ok ? (data as User) : (data as User) ?? emptyUser;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return emptyUser;
  }
};

export const removeUser = async (id: string) => {
  const fetchUrl = new URL(`${apiHost.pathname}/users/remove/${id}`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      method: "POST",
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: id }),
    });
    console.debug(`Removing user id('${id}'): '${response.status}'`);

    return response.status;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};

export const findUsers = async () => {
  const fetchUrl = new URL(`${apiHost.pathname}/users`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);
  try {
    const response = await fetch(fetchUrl.toString(), {
      //@TODO: enabling mode here and perhaps in other functions interferes with account creation
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    console.debug(
      `Pulling user data: '${response.ok ? "success" : response.status}'`
    );

    const data: Users = response.ok ? await response.json() : null;
    return data?.data;
  } catch (err) {
    throw new Error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
  }
};

export const findOneUserById = async (id: string) => {
  const fetchUrl = new URL(`${apiHost.pathname}/users/${id}`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    console.debug(`Finding user('${id}'): '${response.status}'`);

    if (!response.ok) return;

    //@TODO: randomly throws "'SyntaxError: Unexpected end of JSON input'"; execution too quick?
    // if (response.ok) {
    const result = (await response.json()) as User;
    console.debug("findOneUserById: raw user: ");
    console.dir(result);
    return result;
    // };
    // return response.ok ? ((await response.json()) as User) : null;
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.warn(
        `Does '${fetchUrl.toString()}' contain json formated data?'`
      );
      return;
    }
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
  }
};

export const findOneUserByAddress = async (address: string) => {
  const fetchUrl = new URL(
    `${apiHost.pathname}/users/byWallet/${address}`,
    apiHost
  );
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    console.debug(`Finding user('${address}'): '${response.status}'`);

    if (!response.ok) return;

    //@TODO: randomly throws "'SyntaxError: Unexpected end of JSON input'"; execution too quick?
    // if (response.ok) {
    const result = (await response.json()) as User;
    console.debug("findOneUserByAddress: raw user: ");
    console.dir(result);
    return result;
    // };
    // return response.ok ? ((await response.json()) as User) : null;
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.warn(
        `Does '${fetchUrl.toString()}' contain json formated data?'`
      );
      return;
    }
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
  }
};

export const findOneUserByEmail = async (email: string) => {
  const fetchUrl = new URL(
    `${apiHost.pathname}/users/byEmail/${email}`,
    apiHost
  );
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    console.debug(`Finding user('${email}'): '${response.status}'`);

    if (!response.ok) return;

    //@TODO: randomly throws "'SyntaxError: Unexpected end of JSON input'"; execution too quick?
    // if (response.ok) {
    const result = (await response.json()) as User;
    console.debug("findOneUserByAddress: raw user: ");
    console.dir(result);
    return result;
    // };
    // return response.ok ? ((await response.json()) as User) : null;
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.warn(
        `Does '${fetchUrl.toString()}' contain json formated data?'`
      );
      return;
    }
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
  }
};

export const uploadUserAvatar = async (avatar: any, id: string) => {
  const formData = new FormData();
  formData.append("file", avatar);

  const options = {
    method: "POST",
    // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    body: formData,
  };

  const uploadUrl = new URL(`${apiHost.pathname}/users/avatars`, apiHost);
  console.debug(`fetching url: ${uploadUrl.href}`);

  try {
    const response = await fetch(uploadUrl.toString(), options);
    console.debug(
      `Uploading avatar('${id}') avatar(size:'${avatar.length}'): ${response.status}`
    );

    const data: ApiResponse = response.ok ? await response.json() : {};
    const avatarUrl = data.path ?? "";
    console.debug(`Saving avatar('${id}') avatar: '${avatarUrl}'`);
    const updateUrl = new URL(
      `${apiHost.pathname}/users/updateAvatar`,
      apiHost
    );
    console.debug(`fetching url: ${updateUrl}`);

    try {
      const avatarRes = await fetch(updateUrl.toString(), {
        method: "POST",
        // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id, url: avatarUrl }),
      });
      return avatarRes.status;
    } catch (e) {
      console.error(`Error fetching('${updateUrl.toString()}'): '${e}'`);
      return StatusCodes.INTERNAL_SERVER_ERROR;
    }
  } catch (e) {
    console.error(
      `Error uploading avatar('${uploadUrl.toString()}') image: '${e}'`
    );
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};

export const updateUserAvatar = async (id: string, avatarUrl: string) => {
  const fetchUrl = new URL(`${apiHost.pathname}/users/updateAvatar`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      method: "POST",
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: id, url: avatarUrl }),
    });
    console.debug(
      `Updating user('${id}') image('${avatarUrl}'): '${response.status}'`
    );

    return response.status;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};

export const uploadUserImage = async (image: any, id: string) => {
  const formData = new FormData();
  formData.append("file", image);

  const options = {
    method: "POST",
    // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    body: formData,
  };

  const uploadUrl = new URL(`${apiHost.pathname}/users/images`, apiHost);
  console.debug(`fetching url: ${uploadUrl.href}`);

  try {
    const response = await fetch(uploadUrl.toString(), options);
    console.debug(
      `Uploading avatar('${id}') image(size:'${image.length}'): ${response.status}`
    );

    const data: ApiResponse = response.ok ? await response.json() : {};
    const imageUrl = data.path ?? "";
    console.debug(`Saving user('${id}') image: '${imageUrl}'`);
    const updateUrl = new URL(`${apiHost.pathname}/users/updateImage`, apiHost);
    console.debug(`fetching url: ${updateUrl}`);

    try {
      const imgRes = await fetch(updateUrl.toString(), {
        method: "POST",
        // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id, url: imageUrl }),
      });
      return imgRes.status;
    } catch (e) {
      console.error(`Error fetching('${updateUrl.toString()}'): '${e}'`);
      return StatusCodes.INTERNAL_SERVER_ERROR;
    }
  } catch (e) {
    console.error(
      `Error uploading avatar('${uploadUrl.toString()}') image: '${e}'`
    );
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};

export const downloadUserImage = async (image: any) => {
  const downloadUrl = new URL(
    `${apiHost.pathname}/users/images/${image}`,
    apiHost
  );
  console.debug(`fetching url: ${downloadUrl.href}`);
  try {
    const response = await fetch(downloadUrl.toString(), {
      //@TODO: enabling mode here and perhaps in other functions interferes with account creation
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    });
    console.debug(
      `Pulling user data: '${response.ok ? "success" : response.status}'`
    );

    // const data: Users = response.ok ? await response.json() : null;
    // return data?.data;
  } catch (err) {
    throw new Error(`Error fetching('${downloadUrl.toString()}'): '${err}'`);
  }
};

export const updateUserImage = async (id: string, imageUrl: string) => {
  const fetchUrl = new URL(`${apiHost.pathname}/users/updateImage`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      method: "POST",
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: id, url: imageUrl }),
    });
    console.debug(
      `Updating user('${id}') image('${imageUrl}'): '${response.status}'`
    );

    return response.status;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};

export const uploadBannerImage = async (image: any, id: string) => {
  const formData = new FormData();
  formData.append("file", image);

  const options = {
    method: "POST",
    // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
    body: formData,
  };

  const uploadUrl = new URL(`${apiHost.pathname}/users/images`, apiHost);
  console.debug(`fetching url: ${uploadUrl}`);

  try {
    const response = await fetch(uploadUrl.toString(), options);
    console.debug(
      `Uploading banner('${id}') image(size:'${image.length}'): ${response.status}`
    );

    const data: ApiResponse = response.ok ? await response.json() : {};
    const bannerUrl = data.path ?? "";
    console.debug(`Saving banner('${id}') image: '${bannerUrl}'`);
    const updateUrl = new URL(
      `${apiHost.pathname}/users/updateBanner`,
      apiHost
    );
    console.debug(`fetching url: ${updateUrl}`);

    try {
      const bannerRes = await fetch(updateUrl.toString(), {
        method: "POST",
        // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id, url: bannerUrl }),
      });
      return bannerRes.status;
    } catch (e) {
      console.error(`Error fetching('${updateUrl.toString()}'): '${e}'`);
      return StatusCodes.INTERNAL_SERVER_ERROR;
    }
  } catch (err) {
    console.error(`Error fetching('${uploadUrl.toString()}'): '${err}'`);
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};

export const saveSetting = async (id: string, settings: string[]) => {
  const fetchUrl = new URL(`${apiHost.pathname}/users/saveSetting`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      method: "POST",
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: id, settings: settings }),
    });
    console.debug(`Saving settings('${id}')`);

    return response.ok ?? response.status;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};

export const updateRoles = async (id: string, roles: string[]) => {
  const fetchUrl = new URL(`${apiHost.pathname}/users/updateRoles`, apiHost);
  console.debug(`fetching url: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl.toString(), {
      method: "POST",
      // mode: publicRuntimeConfig.corsMode || 'no-cors', // no-cors, *cors, same-origin
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: id, roles: roles }),
    });
    console.debug(`Saving roles('${id}'): '${roles}'`);

    return response.ok ?? response.status;
  } catch (err) {
    console.error(`Error fetching('${fetchUrl.toString()}'): '${err}'`);
    return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};
