import * as React from "react";
import { Modal } from "../Modal";
import "./style.css";
import { painter } from "../libs";

export default function Header({ setModalOn }) {
  const [imgSrc, setImgSrc] = React.useState(null);
  const exportImage = async () => {
    const res = await painter.exportImage();

    const url = window.URL.createObjectURL(res);
    setImgSrc(url);
  };
  const reset = () => setImgSrc(null);
  const [changed, setChanged] = React.useState(true);

  React.useEffect(() => {
    painter.init({
      container: document.querySelector("#canvas") as HTMLDivElement,
      on: {
        change: function (cnt: number) {
          if (cnt > 0) setChanged(false);
          else setChanged(true);
        },
      },
    });
    return () => {
      painter.off("change", function (cnt: number) {
        if (cnt > 0) setChanged(false);
        else setChanged(true);
      });
    };
  }, []);

  return (
    <>
      <header id="header">
        <h2 id="title">이미지 위저드</h2>
        <div id="btnGroup">
          <button
            id="exportBtn"
            onClick={exportImage}
            disabled={changed}
            style={{
              background: changed ? "grey" : "#0d99ff",
              cursor: changed ? "not-allowed" : "pointer",
            }}
          >
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
