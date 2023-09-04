import * as React from "react";
import { painter } from "../libs";
import "./style.css";

export default function Tool() {
  const setStrokeColor = (e) => {
    const color = (e.target as HTMLSelectElement).value;
    painter.setStrokeColor(color);
  };
  const setStrokeWidth = (e) => {
    const width = (e.target as HTMLInputElement).value;
    painter.setStrokeWidth(width);
  };
  const [mode, setMode] = React.useState("edit");
  React.useEffect(() => {
    painter.setDrawingMode(mode);
  }, [mode]);

  const changeToAnotherMode = () => {
    painter.setDrawingMode("edit");
    setMode("edit");
  };

  return (
    <div id="tool-area">
      <h2>Drawing Control Menu</h2>
      <div id="tool-area-btns">
        <div>
          1) Turning On/Off Masking mode:
          <button
            disabled={mode === "visibility" ? true : false}
            id="maskingBtn"
            onClick={changeToAnotherMode}
            style={{
              cursor: mode === "visibility" ? "not-allowed" : "pointer",
              background:
                mode === "edit"
                  ? "green"
                  : mode === "visibility"
                  ? "grey"
                  : "red",
            }}
          >
            {mode === "edit" ? "편집 모드 ON" : "편집 모드 OFF"}
          </button>
        </div>
        <div>
          2) Selecting brush/eraser :
          <div id="brush-eraser-btns">
            <button
              disabled={mode === "visibility" ? true : false}
              style={{
                cursor: mode === "visibility" ? "not-allowed" : "pointer",
                background: mode === "brush" ? "yellowGreen" : "none",
              }}
              id="b-btn"
              onClick={() => {
                setMode((prev) => {
                  if (prev === "brush") return "edit";
                  else return "brush";
                });
              }}
            >
              brush
            </button>
            <button
              disabled={mode === "visibility" ? true : false}
              style={{
                cursor: mode === "visibility" ? "not-allowed" : "pointer",
                background: mode === "eraser" ? "yellowGreen" : "none",
              }}
              id="e-btn"
              onClick={() => {
                setMode((prev) => {
                  if (prev === "eraser") return "edit";
                  else return "eraser";
                });
              }}
            >
              eraser
            </button>
          </div>
        </div>
        <br />
        <div>
          3) Selecting Brush Color :
          <select
            id="colorSelection"
            defaultValue="white"
            onChange={setStrokeColor}
          >
            <option value="white">white</option>
            <option value="red">red</option>
            <option value="blue">blue</option>
            <option value="purple">purple</option>
            <option value="orange">orange</option>
          </select>
        </div>
        <br />
        <div>
          4) Control Brush Size
          <input
            type="range"
            id="pixelInput"
            step="5"
            min="5"
            max="55"
            defaultValue={"30"}
            onChange={setStrokeWidth}
          />
        </div>
        <br />
        <div>
          5) Control Visibility
          <input
            defaultChecked={true}
            type="checkbox"
            checked={mode === "visibility" ? false : true}
            onChange={(e) => {
              painter.setVisibility(e.target.checked);
              setMode(e.target.checked ? "edit" : "visibility");
            }}
          />
          {mode === "visibility" ? "눈 감은 상태" : "눈 뜬 상태"}
        </div>
        <br />
        <div className="undo_redo_area">
          <div>6) Undo & Redo</div>
          <div className="undo_redo_btns">
            <button onClick={() => painter.undo()}>&lt;</button>
            <button onClick={() => painter.redo()}>&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
