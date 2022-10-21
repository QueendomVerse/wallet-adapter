import React from "react";
import { notification } from "antd";
import { ArgsProps, NotificationApi } from "antd/lib/notification";
// import 'react-toastify/dist/ReactToastify.css';
import "react-toastify/dist/ReactToastify.min.css";
// import { ToastContainer, toast } from 'react-toastify';

export const notify = ({
  type = "info",
  txid = undefined,
  message = "",
  description = undefined,
  placement = "bottomLeft",
  ...rest
}: {
  type?: keyof NotificationApi;
  txid?: string;
} & ArgsProps) => {
  if (txid) {
    //   <Link
    //     external
    //     to={'https://explorer.solana.com/tx/' + txid}
    //   >
    //     View transaction {txid.slice(0, 8)}...{txid.slice(txid.length - 8)}
    //   </Link>

    description = <></>;
  }
  // console.debug(`notification message: ${message}`);
  // console.debug(`notification description: ${description}`);
  // console.debug(`notification placement: ${placement}`);
  notification[type]({
    ...rest,
    message: <span>{message}</span>,
    description: <span>{description}</span>,
    placement,
  });
  //@TODO: Not rendering, is toastify better?
  // return(
  //   <>
  //     <ToastContainer
  //       position="bottom-left"
  //       autoClose={5000}
  //       hideProgressBar={false}
  //       newestOnTop={false}
  //       closeOnClick
  //       rtl={false}
  //       pauseOnFocusLoss
  //       draggable
  //       pauseOnHover
  //       />
  //       {<span>{message}</span>}
  //     <ToastContainer />
  //   </>
  // );
};
