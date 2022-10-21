import { Button, ButtonProps, Popover, PopoverProps, Space } from "antd";
import React, { useCallback } from "react";

import { useLocalStorage, WalletPublicKeyError } from "../..";
import { useWallet } from "../../contexts/connection/networks/solana";

import { useWalletModal } from "../../contexts";

export interface ConnectButtonProps
  extends ButtonProps,
    React.RefAttributes<HTMLElement> {
  popoverPlacement?: PopoverProps["placement"];
  allowWalletChange?: boolean;
}

export const ConnectButton = ({
  onClick,
  children,
  disabled,
  allowWalletChange,
  popoverPlacement,
  ...rest
}: ConnectButtonProps) => {
  const { wallet, connect, publicKey, connected } = useWallet();
  if (!publicKey) {
    throw new WalletPublicKeyError("Public Key not found!")!;
  }
  const { setVisible } = useWalletModal();

  const localStorage = useLocalStorage();

  const open = useCallback(() => setVisible(true), [setVisible]);

  const handleClick = useCallback(
    () => (wallet ? connect().catch(() => {}) : open()),
    [wallet, connect, open]
  );

  // @TODO: only show if wallet selected or user connected?
  console.debug("ConnectButton", !wallet, !allowWalletChange);
  if (!wallet || !allowWalletChange) {
    return (
      <Button
        {...rest}
        onClick={(e) => {
          onClick && onClick(e);
          handleClick();
          localStorage.setItem("click-signin", "yes");
        }}
        disabled={connected && disabled}
      >
        {connected ? children : "Select A Wallet"}
      </Button>
    );
  }

  return (
    <Popover
      trigger="click"
      placement={popoverPlacement}
      content={
        <Space direction="vertical">
          <Button onClick={open}>Change wallet</Button>
        </Space>
      }
    >
      <Button {...rest} onClick={handleClick} disabled={connected && disabled}>
        Connect
      </Button>
    </Popover>
  );
};
