import * as React from "react";
import { useRef } from "react";
import "./style.css";
import { painter } from "../libs";

function Container({ size, imgSrc, setImgSrc }) {
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

  React.useEffect(() => {
    const [selectedWidth, selectedHeight] = size
      .split(" x ")
      .map((n) => parseInt(n));
    painter.init({
      id: "canvas",
      width: selectedWidth,
      height: selectedHeight,
    });
  }, []);

  React.useEffect(() => {
    if (imgSrc !== null && containerRef !== null) {
      const [selectedWidth, selectedHeight] = size
        .split(" x ")
        .map((n) => parseInt(n));
      painter.importImage({
        src: imgSrc,

        containerWidth: 580, // 문제 2번
        containerHeight: 580,
        selectedWidth,
        selectedHeight,
      });
    }
  }, [size, imgSrc]);

  return (
    <div ref={containerRef} id="container">
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
