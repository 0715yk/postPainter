import * as React from "react";
import { Modal } from "../Modal";
import "./style.css";
import { painter } from "../libs";

export default function Header({ setModalOn }) {
  const [imgSrc, setImgSrc] = React.useState(null);
  const exportImage = async () => {
    await painter.exportImagePrompt((src) => {
      setImgSrc(src);
    });
  };
  const reset = () => setImgSrc(null);

  return (
    <>
      <header id="header">
        <h2 id="title">이미지 위저드</h2>
        <div id="btnGroup">
          <button id="exportBtn" onClick={exportImage}>
            변경 사항 적용
          </button>
          <button id="closeBtn" onClick={setModalOn}>
            X
          </button>
        </div>
      </header>
      {imgSrc !== null && (
        <Modal>
          <div>
            <img src={imgSrc} alt="result" onClick={reset} />
          </div>
        </Modal>
      )}
    </>
  );
}
