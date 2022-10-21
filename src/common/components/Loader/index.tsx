import React, { FC } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

export const Spinner = () => {
  return <Spin indicator={<LoadingOutlined />} />;
};

export const Loader: FC = () => {
  return (
    <>
      <div id="metaplex-loading" className={"loading"}>
        <img
          src={publicRuntimeConfig.publicAppLogoDark}
          style={{ width: "200px", marginBottom: "10px" }}
        />
        <div id="metaplex-loading-text">
          <h4 className="fw-bold">Connecting ...</h4>
        </div>
        <Spinner />
      </div>
    </>
  );
};
