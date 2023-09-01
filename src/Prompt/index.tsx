import * as React from "react";
import Container from "../Container";
import Tool from "../Tool";
import "./style.css";

function Prompt({ size }) {
  return (
    <div id="mainFrame">
      <div id="main">
        <Container size={size} />
        <Tool />
      </div>
    </div>
  );
}

export default Prompt;
