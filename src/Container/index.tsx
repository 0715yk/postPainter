import * as React from "react";
import { useRef } from "react";
import "./style.css";
import { painter } from "../libs";

function Container({ size, imgSrc, setImgSrc, mode }) {
  const [hoverMode, setHoverMode] = React.useState(false);
  const containerRef = useRef<null | HTMLDivElement>(null);

  const getImageSource = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    const img = new Image() as HTMLImageElement;

    reader.readAsDataURL(file);
    reader.onload = (e) => {
      if (img !== null && e?.target !== null) {
        setImgSrc(e.target.result);
      }
    };
  };

  const getImageSource2 = (e) => {
    painter.deleteImage();
    const file = e.target.files[0];
    const reader = new FileReader();
    const img = new Image() as HTMLImageElement;

    reader.readAsDataURL(file);
    reader.onload = (e) => {
      if (img !== null && e?.target !== null) {
        setImgSrc(e.target.result);
      }
    };
  };

  React.useEffect(() => {
    if (imgSrc !== null && containerRef !== null) {
      const [selectedWidth, selectedHeight] = size
        .split(" x ")
        .map((n) => parseInt(n));
      painter.importImage({
        src: imgSrc,
        containerWidth: 580,
        containerHeight: 580,
        selectedWidth,
        selectedHeight,
      });
    }
  }, [size, imgSrc]);

  React.useEffect(() => {
    if (mode === "edit" && imgSrc !== null) {
      setHoverMode(true);
    } else {
      setHoverMode(false);
    }
  }, [mode, imgSrc]);

  return (
    <div ref={containerRef} id="container">
      {hoverMode && (
        <div id="editLayer">
          <button>원본보기</button>
          <input
            id="imageInput"
            accept="image/*"
            type="file"
            onChange={getImageSource2}
          />
          <button
            onClick={() => {
              painter.deleteImage();
              setImgSrc(null);
              setHoverMode(false);
            }}
          >
            이미지 삭제
          </button>
        </div>
      )}
      {imgSrc === null && (
        <div id="imageUploadLayer">
          <input
            id="imageInput"
            accept="image/*"
            type="file"
            onChange={getImageSource}
          />
        </div>
      )}
      <div id="canvas"></div>
    </div>
  );
}

export default Container;
