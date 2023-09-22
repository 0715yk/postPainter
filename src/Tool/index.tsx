import * as React from "react";
import { painter } from "../libs";
import "./style.css";

export default function Tool({ mode, setMode, imgSrc }) {
  const setStrokeWidth = (e) => {
    const width = (e.target as HTMLInputElement).value;

    painter.setStrokeWidth(width);
  };

  React.useEffect(() => {
    painter.setDrawingMode(mode);
  }, [mode]);

  // const changeToAnotherMode = () => {
  //   painter.setDrawingMode("edit");
  //   setMode("edit");
  // };

  document.addEventListener("keydown", (event) => {
    if (event.key === "z") {
      painter.undo();
    } else if (event.key === "y") {
      painter.redo();
    }
  });

  return (
    <div id="tool-area" style={{ display: imgSrc === null ? "none" : "block" }}>
      <h2>Drawing Control Menu</h2>
      <div id="tool-area-btns">
        {/* <div>
          1) Turning On/Off Masking mode:
          <button
            disabled={mode === "off" ? true : false}
            id="maskingBtn"
            onClick={changeToAnotherMode}
            style={{
              cursor: mode === "off" ? "not-allowed" : "pointer",
              background:
                mode === "edit" ? "green" : mode === "off" ? "grey" : "red",
            }}
          >
            {mode === "edit" ? "편집 모드 ON" : "편집 모드 OFF"}
          </button>
        </div> */}
        <div>
          1) Selecting brush/eraser :
          <div id="brush-eraser-btns">
            <button
              disabled={mode === "off" ? true : false}
              style={{
                cursor: mode === "off" ? "not-allowed" : "pointer",
                background: mode === "brush" ? "yellowGreen" : "none",
              }}
              id="b-btn"
              onClick={() => {
                setMode("brush");
              }}
            >
              brush
            </button>
            <button
              disabled={mode === "off" ? true : false}
              style={{
                cursor: mode === "off" ? "not-allowed" : "pointer",
                background: mode === "eraser" ? "yellowGreen" : "none",
              }}
              id="e-btn"
              onClick={() => {
                setMode("eraser");
              }}
            >
              eraser
            </button>
          </div>
        </div>
        <br />
        <br />
        <div>
          2) Control Brush Size
          <input
            type="range"
            id="pixelInput"
            step="5"
            min="10"
            max="100"
            defaultValue={"30"}
            onChange={setStrokeWidth}
          />
        </div>
        <br />
        <div>
          3) Control Visibility
          <input
            type="checkbox"
            checked={mode === "off" ? false : true}
            onChange={(e) => {
              setMode(e.target.checked ? "brush" : "off");
            }}
          />
          {mode === "off" ? "눈 감은 상태" : "눈 뜬 상태"}
        </div>
        <br />
        <div className="undo_redo_area">
          <div>4) Undo & Redo</div>
          <div className="undo_redo_btns">
            <button onClick={() => painter.undo()}>&lt;</button>
            <button onClick={() => painter.redo()}>&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
