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
  const [mode, setMode] = React.useState(null);
  React.useEffect(() => {
    painter.setDrawingMode(mode);
  }, [mode]);

  const changeToAnotherMode = () => {
    painter.setDrawingMode(null);
    setMode(null);
  };

  return (
    <div id="tool-area">
      <h2>Drawing Control Menu</h2>
      <div id="tool-area-btns">
        <div>
          1) Turning On/Off Masking mode:
          <button
            id="maskingBtn"
            onClick={changeToAnotherMode}
            style={{ background: mode === null ? "green" : "red" }}
          >
            편집 모드
          </button>
        </div>
        <div>
          2) Selecting brush/eraser :
          <div id="brush-eraser-btns">
            <button
              disabled={mode === "dummyMode" ? true : false}
              style={{
                background: mode === "brush" ? "yellowGreen" : "none",
              }}
              id="b-btn"
              onClick={() => {
                setMode((prev) => {
                  if (prev === "brush") return null;
                  else return "brush";
                });
              }}
            >
              brush
            </button>
            <button
              disabled={mode === "dummyMode" ? true : false}
              style={{
                background: mode === "eraser" ? "yellowGreen" : "none",
              }}
              id="e-btn"
              onClick={() => {
                setMode((prev) => {
                  if (prev === "eraser") return null;
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
            onChange={(e) => {
              painter.setVisibility(e.target.checked);
              setMode(e.target.checked ? null : "visibility");
            }}
          />
          {mode === "dummyMode" ? "눈 감은 상태" : "눈 뜬 상태"}
        </div>
        <br />
      </div>
    </div>
  );
}
