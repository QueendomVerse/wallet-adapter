require("dotenv").config();
const withPlugins = require("next-compose-plugins");
const withLess = require("next-with-less");
const camelCase = require("camelcase");

const assetPrefix = process.env.ASSET_PREFIX || "";
const plugins = [
  [
    withLess,
    {
      lessLoaderOptions: {
        lessOptions: {
          modifyVars: {
            "@assetPrefix": assetPrefix || "''",
            "@background-color-secondary": "rgba(255, 255, 255)",
          },
          javascriptEnabled: true,
        },
      },
    },
  ],
];

const hasLowerCase = (str) => {
  return str.toUpperCase() != str;
};

const checkEnvDefined = (envVar = "", envName) => {
  if (!envVar) console.warn(`Environment variable ${envName} is undefined`);
  return envVar ?? "";
};

const processEnvs = (envs) => {
  let nextVars = {};
  let sysVars = {};
  for (var env in envs) {
    if (hasLowerCase(env)) continue;

    const setVar = (arr, key, value) => {
      // console.debug(`${key}=${value}`);
      var name = camelCase(key.replace("NEXT_", ""));
      arr[name] = checkEnvDefined(value, key);
    };

    env.includes("NEXT_")
      ? setVar(nextVars, env, envs[env])
      : setVar(sysVars, env, envs[env]);
  }
  return { nextVars, sysVars };
};

const printKey = (k, arr) => {
  console.log(`${k} = ${arr[k]}`);
};

console.log("processing envs ...");
const { nextVars, sysVars } = processEnvs(process.env);

// console.log('--- nextVars ---');
// Object.keys(nextVars).forEach(k => (printKey(k, nextVars)));
// console.log('--- sysVars ---');
// Object.keys(sysVars).forEach(k => (printKey(k, sysVars)));

const basePath = () => {
  return `${setVar(nextVars["basePath"])}`
    ? nextVars["basePath"].startsWith("/")
    : `/${nextVars["basePath"]}`;
};

const matchmakerSsl = () => {
  return "false"
    ? setVar(nextVars["publicMatchmakerSsl"]).toLowerCase() != "false"
    : "true";
};

const setVar = (variable) => variable ?? "";

const serverRuntimeConfig = {
  nodeEnv: setVar(nextVars["nodeEnv"]),
  port: setVar(nextVars["port"] || "3000"),
};

const publicRuntimeConfig = {
  logLevel: setVar(sysVars["logLevel"] || "info"),
  basePath: setVar(basePath()),
  subdomain: setVar(nextVars["subdomain"]),
  strictSubdomain: setVar(nextVars["strictSubdomain"]),
  apiUrl: setVar(nextVars["apiUrl"]),
  corsMode: setVar(nextVars["corsMode"]),
  publicSolanaNetwork: setVar(nextVars["publicSolanaNetwork"] ?? "devnet"),
  publicSolanaRpcHost: setVar(
    nextVars["publicSolanaRpcHost"] ?? "https://api.devnet.solana.com"
  ),
  publicSolanaWsHost: setVar(
    nextVars["publicSolanaWsHost"] ?? "wss://api.devnet.solana.com"
  ),
  publicAppSite: setVar(nextVars["publicAppSite"]),
  publicAppName: setVar(nextVars["publicAppName"]),
  publicAppLogoLight: setVar(nextVars["publicAppLogoLight"]),
  publicAppLogoDark: setVar(nextVars["publicAppLogoDark"]),
  publicNearContractId: setVar(nextVars["publicNearContractId"]),
};

console.log("--- publicRuntimeConfig ---");
Object.keys(publicRuntimeConfig).forEach((k) =>
  printKey(k, publicRuntimeConfig)
);
console.log("--- serverRuntimeConfig ---");
Object.keys(serverRuntimeConfig).forEach((k) =>
  printKey(k, serverRuntimeConfig)
);

module.exports = withPlugins(plugins, {
  assetPrefix,
  reactStrictMode: false, // temporary fix, change back to true and debug
  eslint: {
    ignoreDuringBuilds: true,
  },
  productionBrowserSourceMaps: true,
  serverRuntimeConfig: serverRuntimeConfig,
  publicRuntimeConfig: publicRuntimeConfig,
  async rewrites() {
    return [
      {
        source: "/:any*",
        destination: "/",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:slug",
        destination: "/#/:slug",
        permanent: false,
      },
    ];
  },
});
