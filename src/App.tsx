import * as React from "react";
import { useState } from "react";
import "./App.css";
import Header from "./Header";
import Menu from "./Menu";
import { painter } from "./libs";
import Prompt from "./Prompt";

function App() {
  const [cnt, setCnt] = React.useState(0);
  const [size, setSize] = useState("512 x 512");

  const _setModalOn = React.useCallback(() => {
    const localStorage = window.localStorage;
    localStorage.setItem("size", JSON.stringify(size));
    painter.goTo(cnt);
    setModalOn((prev) => !prev);
  }, [size, cnt]);

  const changeSize = (e) => {
    setSize(e.target.value);
  };

  React.useEffect(() => {
    const localStorage = window.localStorage;
    const cachedSize = JSON.parse(localStorage.getItem("size"));
    if (cachedSize) {
      setSize(cachedSize);
    }
  }, []);
  const [flag, setFlag] = React.useState(false);

  return (
    <>
      <div id="buttons">
        <select id="size" onChange={changeSize}>
          <option>512 x 512</option>
          <option>768 x 512</option>
          <option>512 x 768</option>
          <option>1024 x 576</option>
          <option>576 x 1024</option>
          <option>1024 x 1024</option>
        </select>
      </div>

      <div id="layer">
        <Header
          setModalOn={_setModalOn}
          setCnt={setCnt}
          setFlag={setFlag}
          size={size}
        />
        <div id="horizontal-box">
          <Menu />
          <Prompt size={size} flag={flag} />
        </div>
      </div>
    </>
  );
}

export default App;
