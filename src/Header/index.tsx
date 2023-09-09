import * as React from "react";
import { Modal } from "../Modal";
import "./style.css";
import { painter } from "../libs";

export default function Header({ setModalOn, setSavedStep }) {
  const [imgSrc, setImgSrc] = React.useState(null);

  const [cnt, setCnt] = React.useState(0);

  const exportImage = React.useCallback(async () => {
    const res = await painter.exportImage();

    const url = window.URL.createObjectURL(res);
    setImgSrc(url);
    setSavedStep(cnt);
  }, [cnt, setSavedStep]);

  const reset = () => setImgSrc(null);
  const [changed, setChanged] = React.useState(true);

  React.useEffect(() => {
    const localStorage = window.localStorage;
    const result = JSON.parse(localStorage.getItem("stage"));
    const src = localStorage.getItem("imgSrc");
    const cachedSize = JSON.parse(localStorage.getItem("size"));

    painter.init({
      container: document.querySelector("#canvas") as HTMLDivElement,
      on: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        change: function ({ cnt, stage }: { cnt: number; stage: string }) {
          if (cnt > 0) setChanged(false);
          else setChanged(true);

          setCnt(cnt);
          const localStorage = window.localStorage;
          localStorage.setItem("stage", JSON.stringify(stage));
        },
      },
      cache: result,
    });

    if (result) {
      const [selectedWidth, selectedHeight] = cachedSize
        .split(" x ")
        .map((n) => parseInt(n));

      painter.importImage({
        src,
        containerWidth: 580,
        containerHeight: 580,
        selectedWidth,
        selectedHeight,
      });
    }
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
