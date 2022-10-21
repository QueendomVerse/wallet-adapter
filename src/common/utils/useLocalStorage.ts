type UseStorageReturnValue = {
  getItem: (key: string) => string;
  setItem: (key: string, value: string) => boolean;
  removeItem: (key: string) => void;
  isUpdated: (key: string) => void;
  clear: () => void;
};

export const useLocalStorage = (): UseStorageReturnValue => {
  const isBrowser: boolean = ((): boolean => typeof window !== "undefined")();

  const getItem = (key: string): string => {
    return isBrowser ? window.localStorage[key] : "";
  };

  const setItem = (key: string, value: string): boolean => {
    if (isBrowser) {
      window.localStorage.setItem(key, value);
      return true;
    }

    return false;
  };

  const removeItem = (key: string): void => {
    window.localStorage.removeItem(key);
  };

  // window.addEventListener('storage',e => console.info(e))
  const isUpdated = (key: string) => {
    if (!getItem(key)) {
      return false;
    }
    return true;
  };

  const clear = (): void => {
    window.localStorage.clear();
  };

  return {
    getItem,
    setItem,
    removeItem,
    isUpdated,
    clear,
  };
};
