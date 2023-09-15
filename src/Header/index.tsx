import * as React from "react";
import { Modal } from "../Modal";
import "./style.css";
import { painter } from "../libs";

export default function Header({ setFlag, setModalOn, setCnt, size }) {
  const [imgSrc, setImgSrc] = React.useState(null);
  const [imgSrc2, setImgSrc2] = React.useState(null);
  const [stack, setStack] = React.useState([]);
  const [modalOn, setModal] = React.useState(false);
  const [changed, setChanged] = React.useState(true);
  const exportTest = async (value) => {
    painter.deleteImage();
    painter.importImage(value);
  };

  const exportImage = React.useCallback(async () => {
    const res = await painter.exportMask();
    const url = window.URL.createObjectURL(res);
    const res2 = await painter.exportImage();
    const url2 = window.URL.createObjectURL(res2);
    const [selectedWidth, selectedHeight] = size
      .split(" x ")
      .map((n) => parseInt(n));

    setStack((prev) => {
      const arr = prev.slice();
      const idx = arr.length;
      arr.push({
        idx,
        src: url2,
        selectedWidth: selectedWidth,
        selectedHeight: selectedHeight,
        maskSrc: url,
      });
      return arr;
    });
    setImgSrc(url);
    setImgSrc2(url2);
    setChanged(true);
    setModal(true);
  }, [size]);

  const reset = () => {
    // setImgSrc(null);
    // setImgSrc2(null);
    setModal(false);
  };

  React.useEffect(() => {
    const localStorage = window.localStorage;
    const result = JSON.parse(localStorage.getItem("stage"));

    const func = async () => {
      const response = await painter.init({
        patternSrc: "src/assets/pattern.png",
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
        containerSize: {
          width: 550,
          height: 550,
        },
      });
      if (response) {
        setFlag(true);
      }
    };

    void func();
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
        <h2 id="title">인페인팅</h2>
        <div style={{ display: "flex", gap: "15px" }}>
          {stack.map((el) => {
            return (
              <div
                key={el.idx}
                onClick={() => {
                  void exportTest(el);
                }}
                style={{
                  color: "#FFFFFF",
                  cursor: "pointer",
                  border: "1px solid white",
                  padding: "15px",
                  background: "blue",
                  borderRadius: "5px",
                }}
              >
                {el.idx}
              </div>
            );
          })}
        </div>

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
      {modalOn && (
        <Modal>
          <div onClick={reset} style={{ display: "flex", gap: "20px" }}>
            <img src={imgSrc} alt="result" />
            <img src={imgSrc2} alt="result" />
          </div>
        </Modal>
      )}
    </>
  );
}
