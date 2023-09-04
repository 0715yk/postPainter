import * as React from "react";
import Container from "../Container";
import Tool from "../Tool";
import "./style.css";

function Prompt({ size }) {
  const [imgSrc, setImgSrc] = React.useState(null);
  return (
    <div id="mainFrame">
      <div id="main">
        <Container size={size} imgSrc={imgSrc} setImgSrc={setImgSrc} />
        {imgSrc !== null && <Tool />}
      </div>
    </div>
  );
}

export default Prompt;
