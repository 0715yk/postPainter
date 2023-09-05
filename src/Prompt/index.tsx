import * as React from "react";
import Container from "../Container";
import Tool from "../Tool";
import "./style.css";

function Prompt({ size }) {
  const [imgSrc, setImgSrc] = React.useState(null);
  const [mode, setMode] = React.useState("edit");
  return (
    <div id="mainFrame">
      <div id="main">
        <Container
          size={size}
          imgSrc={imgSrc}
          setImgSrc={setImgSrc}
          mode={mode}
        />
        <Tool mode={mode} setMode={setMode} imgSrc={imgSrc} />
      </div>
    </div>
  );
}

export default Prompt;
