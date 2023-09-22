import * as React from "react";
import { useRef } from "react";
import "./style.css";
import { painter } from "../libs";
import useDidMountEffect from "../hooks/useDidMountEffect";

function Container({ flag, size, imgSrc, setImgSrc, mode }) {
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

  useDidMountEffect(() => {
    if (imgSrc !== null) {
      const [selectedWidth, selectedHeight] = size
        .split(" x ")
        .map((n) => parseInt(n));
      console.log(selectedHeight, selectedWidth, imgSrc);
      if (flag) {
        painter.importImage({
          src: imgSrc,
          selectedWidth,
          selectedHeight,
        });

        const localStorage = window.localStorage;
        localStorage.setItem("imgSrc", imgSrc);
      }
    }
  }, [size, imgSrc, flag]);

  React.useEffect(() => {
    if (mode === "edit" && imgSrc !== null) {
      setHoverMode(true);
    } else {
      setHoverMode(false);
    }
  }, [mode, imgSrc]);

  React.useEffect(() => {
    const imgSource = localStorage.getItem("imgSrc");
    if (imgSource) {
      setImgSrc(imgSource);
    }
  }, []);

  return (
    <>
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
    </>
  );
}

export default Container;
