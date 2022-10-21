import { CopyOutlined } from "@ant-design/icons";
import { Divider, Space, Tooltip } from "antd";
import React from "react";
import { Link } from "react-router-dom";

import { useWallet } from "../../contexts/connection/networks/solana";

import { shortenAddress } from "../../utils";
import { Identicon } from "../Identicon";

export const Settings = ({
  additionalSettings,
}: {
  additionalSettings?: JSX.Element;
}) => {
  const { publicKey } = useWallet();

  return (
    <div className="metaplex-settings">
      <Space direction="vertical" align="center">
        <Identicon address={publicKey?.toBase58()} size={48} />
        {publicKey && (
          <>
            <Tooltip title="Address copied">
              <div
                onClick={() =>
                  navigator.clipboard.writeText(publicKey?.toBase58() || "")
                }
              >
                <CopyOutlined />
                &nbsp;{shortenAddress(publicKey?.toBase58())}
              </div>
            </Tooltip>

            <Link to={`/profile`}>View Profile</Link>
          </>
        )}
      </Space>
      {additionalSettings && (
        <>
          <Divider />
          {additionalSettings}
        </>
      )}
    </div>
  );
};
