import Konva from "konva";

function getDrawCursor(
  strokeWidth: number,
  brushColor: string,
  strokeColor?: string
) {
  // 문제 3번
  const circle = `
      <svg
        height="${strokeWidth}"
        fill="${brushColor}"
        viewBox="0 0 ${strokeWidth * 2} ${strokeWidth * 2}"
        width="${strokeWidth}"
        xmlns="http://www.w3.org/2000/svg"
        stroke="${strokeColor ? strokeColor : "black"}"
      >
        <circle
          cx="50%"
          cy="50%"
          r="${strokeWidth}"    
          fill="${brushColor}"
          stroke="${strokeColor ? strokeColor : "black"}"
        />
      </svg>
    `;
  return `url(data:image/svg+xml;base64,${window.btoa(circle)}) ${Math.ceil(
    strokeWidth / 2
  )} ${Math.ceil(strokeWidth / 2)}, pointer`;
}

const paintingTool = function () {
  // 컨테인 방식으로 사이즈 반환
  const output = {
    width: 0,
    height: 0,
    image: null,
  };
  let drawingModeOn = false;
  let drawingMode = "brush";
  let scale = 1;
  let stage = null as null | Konva.Stage;
  let drawLayer = null as null | Konva.Layer;
  let imageLayer = null as null | Konva.Layer;
  const brushOptions = {
    strokeWidth: 30,
    color: "#ffffff",
  } as { strokeWidth: number; color: string };
  const getContainSize = (
    containerWidth,
    containerHeight,
    outputWidth,
    outputHeight
  ) => {
    const containerRatio = containerWidth / containerHeight;
    const outputRatio = outputWidth / outputHeight;
    return containerRatio < outputRatio
      ? { width: containerWidth, height: containerWidth / outputRatio }
      : { width: containerHeight * outputRatio, height: containerHeight };
  };
  let currentLine = null; // 현재 그리는 선을 저장하기 위한 변수

  const undoStack = []; // undo를 위한 스택
  const redoStack = []; // redo를 위한 스택
  return {
    undo() {
      if (undoStack.length > 0) {
        const lineToRemove = undoStack.pop();
        redoStack.push(lineToRemove);
        lineToRemove.destroy();
        drawLayer.batchDraw();
      }
    },
    redo() {
      if (redoStack.length > 0) {
        const lineToRedraw = redoStack.pop();
        undoStack.push(lineToRedraw);
        drawLayer.add(lineToRedraw);
        drawLayer.batchDraw();
      }
    },
    init: ({
      id,
      brushOption,
      width,
      height,
    }: {
      id: string;
      brushOption?: { strokeWidth: number; color: string };
      width?: number;
      height?: number;
    }) => {
      stage = new Konva.Stage({
        container: id,
        width,
        height,
      });
      imageLayer = new Konva.Layer();
      drawLayer = new Konva.Layer();

      stage.add(imageLayer);
      stage.add(drawLayer);

      let isPaint = false;

      if (brushOption) {
        brushOptions.color = brushOption.color;
        brushOptions.strokeWidth = brushOption.strokeWidth;
      }

      stage.on("mousedown", () => {
        if (!drawingModeOn) return;
        isPaint = true;

        const x = (stage.getPointerPosition().x - drawLayer.x()) / scale;
        const y = (stage.getPointerPosition().y - drawLayer.y()) / scale;

        currentLine = new Konva.Line({
          stroke: brushOptions?.color,
          strokeWidth: brushOptions?.strokeWidth / scale,
          globalCompositeOperation:
            drawingMode === "brush" ? "source-over" : "destination-out",
          lineCap: "round",
          lineJoin: "round",
          points: [x, y, x, y],
        });

        drawLayer.add(currentLine);
      });

      stage.on("mousemove", ({ evt }) => {
        if (!drawingModeOn) return;
        if (!isPaint) return;

        evt.preventDefault();

        const x = (stage.getPointerPosition().x - drawLayer.x()) / scale;
        const y = (stage.getPointerPosition().y - drawLayer.y()) / scale;

        currentLine.points(currentLine.points().concat([x, y]));
      });

      stage.on("mouseup", () => {
        if (!drawingModeOn) return;
        isPaint = false;

        undoStack.push(currentLine);
      });
    },

    // 이미지 불러오기
    importImage: ({
      src,
      containerWidth,
      containerHeight,
      selectedWidth,
      selectedHeight,
    }) => {
      const imageElement = new Image();

      imageElement.onload = () => {
        const { width: stageW, height: stageH } = getContainSize(
          containerWidth,
          containerHeight,
          selectedWidth,
          selectedHeight
        );

        stage.width(stageW);
        stage.height(stageH);

        const { width: imageW, height: imageH } = imageElement;

        const stageRatio = stageW / stageH;
        const imageRatio = imageW / imageH;

        let width = stageW;
        let height = stageH;
        let x = 0;
        let y = 0;

        if (stageRatio < imageRatio) {
          // 이미지 높이를 스테이지 높이에 맞추고, 비율에 따라 늘어난 이미지 너비를 크롭
          width = stageH * imageRatio;
          x = (stageW - width) / 2;
        } else if (stageRatio > imageRatio) {
          // 이미지 너비를 스테이지 너비에 맞추고, 비율에 따라 늘어난 높이를 크롭
          height = stageW / imageRatio;
          y = (stageH - height) / 2;
        }

        scale = stageRatio < imageRatio ? stageH / imageH : stageW / imageW;

        imageLayer.destroyChildren();
        imageLayer.add(
          new Konva.Image({ image: imageElement, width, height, x, y })
        );
        const copyDiv = document.createElement("div");
        copyDiv.id = "app";
        document.body.appendChild(copyDiv);

        const copyStage = new Konva.Stage({
          container: "app",
          width: stageW,
          height: stageH,
        });

        copyStage.add(imageLayer.clone());
        const base64 = copyStage.toCanvas().toDataURL("image/png", 0);
        Object.assign(output, {
          width: selectedWidth,
          height: selectedHeight,
          image: base64,
        });

        copyDiv.remove();
        copyStage.remove();
        drawLayer.position({ x, y });
        drawLayer.scale({ x: scale, y: scale });
        drawLayer.moveToTop();
      };

      imageElement.src = src;
    },
    exportImagePrompt(func) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const foreground = new Image();

      canvas.width = output.width;
      canvas.height = output.height;

      let resultUrl = "";
      foreground.onload = () => {
        context.drawImage(foreground, 0, 0, output.width, output.height);
        resultUrl = canvas.toDataURL("image/png");
        // 1번 문제
        func(resultUrl);
      };
      foreground.src = stage.clone().toDataURL({ pixelRatio: 2 });
    },

    setStrokeColor(color: string) {
      brushOptions.color = color;
      if (!drawingModeOn || drawingMode === "eraser") return;
      if (stage !== null && brushOptions.strokeWidth !== null) {
        stage.container().style.cursor = getDrawCursor(
          brushOptions.strokeWidth,
          color,
          drawingMode === "brush" && color
        );
      }
    },
    setStrokeWidth(width: number | string) {
      if (typeof width === "string") {
        brushOptions.strokeWidth = parseInt(width);
      } else {
        brushOptions.strokeWidth = width;
      }
      if (!drawingModeOn) return;
      if (stage !== null && brushOptions.color !== null) {
        stage.container().style.cursor = getDrawCursor(
          brushOptions.strokeWidth,
          drawingMode === "eraser" ? "none" : brushOptions.color,
          drawingMode === "brush" && brushOptions.color
        );
      }
    },
    setDrawingMode(mode: string) {
      console.log(mode);
      if (mode === "edit") {
        drawingModeOn = false;
        stage.container().style.cursor = "default";
        return;
      } else if (mode === "visibility") {
        stage.container().style.cursor = "not-allowed";
      }
      drawingModeOn = true;
      drawingMode = mode;
      if (mode === "eraser") {
        if (stage !== null && drawingModeOn) {
          stage.container().style.cursor = getDrawCursor(
            brushOptions.strokeWidth,
            "none"
          );
        }
      } else if (mode === "brush") {
        if (stage !== null && drawingModeOn) {
          stage.container().style.cursor = getDrawCursor(
            brushOptions.strokeWidth,
            brushOptions.color,
            brushOptions.color
          );
        }
      }
    },
    setVisibility(status: boolean) {
      if (status) {
        drawLayer.show();
      } else {
        drawLayer.hide();
      }
      this.setDrawLayer(status);
    },

    setDrawLayer(status: boolean) {
      if (status) {
        let lastLine;
        let isPaint = false;

        stage.on("mousedown", () => {
          if (!drawingModeOn) return;
          isPaint = true;

          const x = (stage.getPointerPosition().x - drawLayer.x()) / scale;
          const y = (stage.getPointerPosition().y - drawLayer.y()) / scale;

          lastLine = new Konva.Line({
            stroke: brushOptions?.color,
            strokeWidth: brushOptions?.strokeWidth / scale,
            globalCompositeOperation:
              drawingMode === "brush" ? "source-over" : "destination-out",
            lineCap: "round",
            lineJoin: "round",
            points: [x, y, x, y],
          });

          drawLayer.add(lastLine);
        });

        stage.on("mousemove", ({ evt }) => {
          if (!drawingModeOn) return;
          if (!isPaint) return;

          evt.preventDefault();

          const x = (stage.getPointerPosition().x - drawLayer.x()) / scale;
          const y = (stage.getPointerPosition().y - drawLayer.y()) / scale;

          lastLine.points(lastLine.points().concat([x, y]));
        });

        stage.on("mouseup", () => {
          if (!drawingModeOn) return;
          isPaint = false;
        });
      } else {
        stage.off("mousedown");
        stage.off("mousemove");
        stage.off("mouseup");
      }
    },
  };
};
const painter = paintingTool();

export { painter };

// 모듈 폴리싱
// 뒤로가기, 앞으로 가기
// 기획서 재검토
// 모듈 documentation 작성
// inpainting 로직
