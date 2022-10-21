import React from "react";
import { Button } from "antd";
import { LABELS } from "../../constants";
import { useNavigate } from "react-router-dom";

export const BackButton = () => {
  const navigate = useNavigate();
  return (
    <Button type="text" onClick={() => navigate(-1)}>
      {LABELS.GO_BACK_ACTION}
    </Button>
  );
};
