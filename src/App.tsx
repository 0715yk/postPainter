import * as React from "react";
import { useState } from "react";
import "./App.css";
import Header from "./Header";
import Menu from "./Menu";
import { Modal } from "./Modal";
import Prompt from "./Prompt";
import useDidMountEffect from "./hooks/useDidMountEffect";

function App() {
  const [modalOn, setModalOn] = useState(false);
  const [size, setSize] = useState("512 x 512");
  const _setModalOn = () => {
    setModalOn((prev) => !prev);
  };
  const changeSize = (e) => {
    setSize(e.target.value);
  };

  useDidMountEffect(() => {
    const localStorage = window.localStorage;
    localStorage.setItem("size", JSON.stringify(size));
  }, [size]);

  React.useEffect(() => {
    const localStorage = window.localStorage;
    const cachedSize = JSON.parse(localStorage.getItem("size"));
    if (cachedSize) {
      setSize(cachedSize);
    }
  }, []);

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
        <button id="wizardBtn" onClick={_setModalOn}>
          이미지 위자드
        </button>
      </div>
      <Modal
        className="dimmedModal"
        style={{ display: modalOn ? "inline" : "none" }}
      >
        <div id="layer">
          <Header setModalOn={_setModalOn} />
          <div id="horizontal-box">
            <Menu />
            <Prompt size={size} />
          </div>
        </div>
      </Modal>
    </>
  );
}

export default App;
