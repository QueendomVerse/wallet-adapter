import React, {
  FC,
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { useBetween } from "use-between";
import { useRouter } from "next/router";
// import { useNavigate } from 'react-router-dom';
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { ParsedUrlQuery } from "querystring";
import { useShareableWalletConnectedState } from "../../../../../contexts/sharedStates";

import { useLocation } from "react-router-dom";

export function useQuerySearch() {
  return new URLSearchParams(useLocation().search);
}

interface Props {
  children: ReactNode;
}

interface Params extends ParsedUrlQuery {
  account_id: string;
  public_key: string;
  all_keys: string[];
  transactionHashes: string[];
}

interface BrowserWalletContextState {
  accountId: string;
  setAccountId: (accountId: string) => void;
  publicKey: string;
  setPublicKey: (publicKey: string) => void;
  allKeys: string[];
  setAllKeys: (allKeys: string[]) => void;
}

const DEFAULT_CONTEXT_STATE = {
  accountId: "",
  setAccountId: () => {},
  publicKey: "",
  setPublicKey: () => {},
  allKeys: [""],
  setAllKeys: () => {},
};

const BrowserWalletContext = createContext<BrowserWalletContextState>(
  DEFAULT_CONTEXT_STATE
);

export const BrowserWalletProvider: FC<Props> = ({ children }) => {
  const { isWalletConnected } = useBetween(useShareableWalletConnectedState);

  const [loading, setLoading] = useState(false);

  // const navigate = useNavigate();
  const router = useRouter();
  const searchParams = useQuerySearch();
  const routerQuery = router.query as Params;

  const [accountId, setAccountId] = useState<string>(
    routerQuery.account_id ?? searchParams.get("account_id")
  );
  const [publicKey, setPublicKey] = useState<string>(
    routerQuery.public_key ?? searchParams.get("public_key")
  );
  const [allKeys, setAllKeys] = useState<string[]>(
    routerQuery.all_keys ?? searchParams.get("all_keys")
  );

  const [transactionHashes, setTransactionHashes] = useState<string[]>(
    routerQuery.transactionHashes ?? searchParams.get("transactionHashes")
  );

  const contextValue = useMemo(() => {
    setLoading(true);

    const state = {
      accountId,
      setAccountId,
      publicKey,
      setPublicKey,
      allKeys,
      setAllKeys,
      transactionHashes,
      setTransactionHashes,
    };

    setLoading(false);
    return state;
  }, [accountId, publicKey, allKeys, transactionHashes]);

  useEffect(() => {
    if (!isWalletConnected && accountId && publicKey && allKeys) {
      const getPrevPath = () => {
        const redirectUrl = new URL(document.URL);
        const prevHash = redirectUrl.hash.split("#");
        if (prevHash.length < 2) return "";

        return prevHash[1] ?? redirectUrl.pathname;
      };
      const prevPath = getPrevPath();
      const toPage = new URL(`/%23${prevPath}`, window.location.origin);
      const toPageString = toPage.href.replace(/%23/g, "#"); // for HashRouter
      console.info(`To page URL with parameters 2: ${toPageString}`);

      // navigate('/signin');
      // navigate(-2)
      // navigate('/signup');
      console.warn("redirecting back ... 2");
      router.push(toPageString);
    }
  }, [isWalletConnected, accountId, publicKey, allKeys]);

  useEffect(() => {
    if (isWalletConnected && transactionHashes) {
      const getPrevPath = () => {
        const redirectUrl = new URL(document.URL);
        const prevHash = redirectUrl.hash.split("#");
        if (prevHash.length < 2) return "";

        return prevHash[1] ?? redirectUrl.pathname;
      };
      const prevPath = getPrevPath();
      const toPage = new URL(`/%23${prevPath}`, window.location.origin);
      const toPageString = toPage.href.replace(/%23/g, "#"); // for HashRouter
      console.info(`To page URL with parameters 2: ${toPageString}`);

      // navigate('/signin');
      // navigate(-2)
      // navigate('/signup');
      console.info("Got Near transaction hashes", transactionHashes);
      console.warn("redirecting back ... 2");
      router.push(toPageString);
    }
  }, [isWalletConnected, transactionHashes]);

  if (loading) {
    return (
      <div className="loading-div">
        <Spin indicator={<LoadingOutlined />} />
      </div>
    );
  }

  return (
    <BrowserWalletContext.Provider value={contextValue}>
      {children}
    </BrowserWalletContext.Provider>
  );
};

export const useBrowserWallet = () => useContext(BrowserWalletContext);
