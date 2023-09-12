/* eslint-disable @typescript-eslint/no-namespace */
// import Konva from "konva";
// import imagePrompt from "image-prompt";

// export { imagePrompt as painter };
// import Konva from "konva";

import pattern from "./assets/pattern.jpg";
import Konva from "konva";

export function getDrawCursor(
  strokeWidth: number,
  brushColor: string,
  strokeColor?: string
) {
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

export function dataURItoBlob(dataURI: string) {
  const byteString = window.atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  const bb = new Blob([ab], { type: mimeString });
  return bb;
}

export function getContainSize(
  containerWidth: number,
  containerHeight: number,
  outputWidth: number,
  outputHeight: number
) {
  const containerRatio = containerWidth / containerHeight;
  const outputRatio = outputWidth / outputHeight;
  return containerRatio < outputRatio
    ? { width: containerWidth, height: containerWidth / outputRatio }
    : { width: containerHeight * outputRatio, height: containerHeight };
}

export namespace Event {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type CallbackTypes = Record<string, (...args: any[]) => void>;

  export type Events<T extends CallbackTypes> = keyof T;
  export type Callback<T extends CallbackTypes, E extends Events<T>> = T[E];

  export type CallbackArgs<
    E extends Events<T>,
    T extends CallbackTypes
  > = Parameters<T[E]>;

  export type Listeners<T extends CallbackTypes> = {
    [E in Events<T>]?: Array<T[E]>;
  };
}

export class EventListeners<T extends Event.CallbackTypes> {
  private _listeners: Event.Listeners<T>;

  constructor() {
    this._listeners = {};
  }

  addEventListener<E extends Event.Events<T>>(event: E, callback: T[E]) {
    if (!(event in this._listeners)) {
      this._listeners[event] = [];
    }
    this._listeners[event]?.push(callback);
  }

  removeEventListener<E extends Event.Events<T>>(event: E, callback: T[E]) {
    this._listeners[event] = this._listeners[event]?.filter(
      (fn) => fn !== callback
    );
  }

  dispatch<E extends Event.Events<T>>(
    event: E,
    ...args: Event.CallbackArgs<E, T>
  ) {
    this._listeners[event]?.forEach((fn) => fn(...args));
  }
}

const inpainter = function () {
  const output = {
    width: 0,
    height: 0,
    image: null,
  };
  let history: Konva.Line[] = [];
  let historyStep = 0;

  const brushOptions = {
    strokeWidth: 30,
    color: "#ffffff",
  } as { strokeWidth: number; color: string };

  let drawingModeOn = false;
  let drawingMode: "brush" | "eraser" | "on" | "off" = "brush";
  let scale = 1;
  let stage = null as null | Konva.Stage;
  let drawLayer = null as null | Konva.Layer;
  let imageLayer = null as null | Konva.Layer;
  let currentLine: Konva.Line | null = null;

  const eventListener = new EventListeners();

  return {
    goTo(index: number) {
      history = history.filter((line, _) => {
        if (_ >= index) {
          line?.remove();
          return false;
        } else {
          return true;
        }
      });
      drawLayer.batchDraw();
      historyStep = index;
      eventListener.dispatch("change", {
        cnt: historyStep,
        stage: stage?.toJSON(),
      });
    },
    undo() {
      if (historyStep === 0) {
        return;
      }
      historyStep--;
      const lineToRemove = history[historyStep];
      if (lineToRemove !== undefined && drawLayer !== null) {
        lineToRemove.remove();
        drawLayer.batchDraw();
        eventListener.dispatch("change", {
          cnt: historyStep,
          stage: stage?.toJSON(),
        });
      }
    },
    redo() {
      if (historyStep === history.length) {
        return;
      }

      const lineToRedraw = history[historyStep];
      if (lineToRedraw !== undefined && drawLayer !== null) {
        drawLayer.add(lineToRedraw);
        historyStep++;
        drawLayer.batchDraw();
        eventListener.dispatch("change", {
          cnt: historyStep,
          stage: stage?.toJSON(),
        });
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(eventType: string, eventCallback: (...args: any) => void) {
      eventListener.addEventListener(eventType, eventCallback);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    off(eventType: string, eventCallback: (...args: any) => void) {
      eventListener.removeEventListener(eventType, eventCallback);
    },
    init: function ({
      container,
      brushOption,
      width,
      height,
      on,
      cache,
    }: {
      container: string | HTMLDivElement;
      brushOption?: { strokeWidth: number; color: string };
      width?: number;
      height?: number;
      on?: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [eventType: string]: (arg: any) => void;
      };
      cache?: string;
    }) {
      if (cache) {
        stage = Konva.Node.create(cache, container) as Konva.Stage;
        const iLayer = stage.findOne("#imageLayer") as Konva.Layer;
        const dLayer = stage.findOne("#drawLayer") as Konva.Layer;

        imageLayer = iLayer;
        drawLayer = dLayer;
      } else {
        stage = new Konva.Stage({
          container,
          width,
          height,
        });

        imageLayer = new Konva.Layer({
          id: "imageLayer",
        });
        drawLayer = new Konva.Layer({
          id: "drawLayer",
        });
        stage.add(imageLayer);
        stage.add(drawLayer);
      }

      let isPaint = false;

      if (brushOption) {
        brushOptions.color = brushOption.color;
        brushOptions.strokeWidth = brushOption.strokeWidth;
      }

      stage.on("mousedown", () => {
        if (!drawingModeOn) return;
        isPaint = true;

        if (stage !== null) {
          const pointerPosition = stage.getPointerPosition();
          if (drawLayer !== null && pointerPosition !== null) {
            const x = (pointerPosition.x - drawLayer.x()) / scale;
            const y = (pointerPosition.y - drawLayer.y()) / scale;
            const minValue = 0.0001;

            currentLine = new Konva.Line({
              stroke: brushOptions?.color,
              strokeWidth: brushOptions?.strokeWidth / scale,
              globalCompositeOperation:
                drawingMode === "brush" ? "source-over" : "destination-out",
              lineCap: "round",
              lineJoin: "round",
              points: [x, y, x + minValue, y + minValue],
            });
            drawLayer.add(currentLine);
            const img = new Image();
            img.onload = () => {
              drawLayer.add(
                new Konva.Rect({
                  globalCompositeOperation: "source-in",
                  fillPatternImage: img,
                  fillPatternRepeat: "repeat",
                  width: 1500,
                  height: 1500,
                  fillPatternScaleY: 3,
                })
              );
            };
            img.src = pattern;
          }
        }
      });

      stage.on("mousemove", ({ evt }) => {
        if (!drawingModeOn) return;
        if (!isPaint) return;

        evt.preventDefault();
        if (stage !== null) {
          const pointerPosition = stage.getPointerPosition();
          if (drawLayer !== null && pointerPosition !== null) {
            const x = (pointerPosition.x - drawLayer.x()) / scale;
            const y = (pointerPosition.y - drawLayer.y()) / scale;
            if (currentLine !== null) {
              currentLine.points(currentLine.points().concat([x, y]));
            }
          }
        }
      });

      stage.on("mouseup", () => {
        if (!drawingModeOn) return;
        if (!isPaint) return;

        isPaint = false;

        if (currentLine !== null) {
          history = history.slice(0, historyStep);
          history.push(currentLine);
          historyStep++;
          eventListener.dispatch("change", {
            cnt: historyStep,
            stage: stage?.toJSON(),
          });
        }
      });

      if (on !== undefined) {
        Object.keys(on).forEach((eventName) => {
          eventListener.addEventListener(eventName, on[eventName]);
        });
      }

      if (container instanceof HTMLDivElement) {
        const divElement = container.firstChild;
        divElement?.addEventListener("mouseleave", function () {
          if (!isPaint) return;
          if (!drawingModeOn) return;

          isPaint = false;

          if (currentLine !== null) {
            history = history.slice(0, historyStep + 1);
            history.push(currentLine);
            historyStep++;
            eventListener.dispatch("change", {
              cnt: historyStep,
              stage: stage?.toJSON(),
            });
          }
        });
      } else {
        const divElement = document.querySelector(container).firstChild;
        divElement?.addEventListener("mouseleave", function () {
          if (!isPaint) return;
          if (!drawingModeOn) return;

          isPaint = false;

          if (currentLine !== null) {
            history = history.slice(0, historyStep + 1);
            history.push(currentLine);
            historyStep++;
            eventListener.dispatch("change", {
              cnt: historyStep,
              stage: stage?.toJSON(),
            });
          }
        });
      }
    },
    importImage({
      src,
      containerWidth,
      containerHeight,
      selectedWidth,
      selectedHeight,
    }: {
      src: string;
      containerWidth: number;
      containerHeight: number;
      selectedWidth: number;
      selectedHeight: number;
    }) {
      const imageElement = new Image();

      imageElement.onload = () => {
        if (stage === null || imageLayer === null || drawLayer === null) return;
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
          width = stageH * imageRatio;
          x = (stageW - width) / 2;
        } else if (stageRatio > imageRatio) {
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
    setStrokeColor(color: string) {
      brushOptions.color = color;
      if (!drawingModeOn || drawingMode === "eraser") return;
      if (stage !== null && brushOptions.strokeWidth !== null) {
        stage.container().style.cursor = getDrawCursor(
          brushOptions.strokeWidth,
          color,
          drawingMode === "brush" ? color : undefined
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
          drawingMode === "brush" ? brushOptions.color : undefined
        );
      }
    },
    setDrawingMode(mode: "brush" | "eraser" | "on" | "off") {
      if (stage !== null && drawLayer !== null) {
        if (mode === "off") {
          drawLayer.hide();
          drawingModeOn = false;
          stage.container().style.cursor = "not-allowed";
          return;
        } else if (mode === "on") {
          this.setDrawingMode(drawingMode);
          return;
        } else if (mode === "eraser") {
          drawingModeOn = true;
          drawLayer.show();
          if (stage !== null) {
            stage.container().style.cursor = getDrawCursor(
              brushOptions.strokeWidth,
              "none"
            );
          }
        } else if (mode === "brush") {
          drawingModeOn = true;
          drawLayer.show();
          if (stage !== null) {
            stage.container().style.cursor = getDrawCursor(
              brushOptions.strokeWidth,
              brushOptions.color,
              brushOptions.color
            );
          }
        }

        drawingMode = mode;
      }
    },
    deleteImage() {
      if (drawLayer !== null && imageLayer !== null) {
        drawLayer.destroyChildren();
        imageLayer.destroyChildren();
        history = [];
        historyStep = 0;
      }
    },
    exportMask() {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const foreground = new Image();

      canvas.width = output.width;
      canvas.height = output.height;

      return new Promise((resolve) => {
        foreground.onload = resolve;
        if (stage !== null) {
          const copyStage = stage.clone();
          copyStage.container().style.backgroundColor = "black";
          const copyImageLayer = copyStage.findOne("#imageLayer");
          copyImageLayer.hide();

          foreground.src = copyStage.toDataURL({ pixelRatio: 2 });
        }
      }).then(() => {
        if (context !== null) {
          context.drawImage(foreground, 0, 0, output.width, output.height);
          const drawingCanvas = canvas;
          if (drawingCanvas !== undefined) {
            const context = drawingCanvas.getContext("2d");
            if (context !== null) {
              context.globalCompositeOperation = "destination-over";
              context.fillStyle = "black";
              context.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
              context.drawImage(drawingCanvas, 0, 0);

              const imgData = context.getImageData(
                0,
                0,
                drawingCanvas.width,
                drawingCanvas.height
              );

              for (let i = 0; i < imgData.data.length; i += 4) {
                const count =
                  imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2];
                let colour = 0;
                if (count > 383) colour = 255;

                imgData.data[i] = colour;
                imgData.data[i + 1] = colour;
                imgData.data[i + 2] = colour;
                imgData.data[i + 3] = 255;
              }

              context.putImageData(imgData, 0, 0);
              const pngURL = drawingCanvas.toDataURL("image/png");
              return dataURItoBlob(pngURL);
            }
          }
        }
      });
    },
    exportMaskingImage() {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const foreground = new Image();

      canvas.width = output.width;
      canvas.height = output.height;

      return new Promise((resolve) => {
        foreground.onload = resolve;

        const copyStage = stage.clone();
        const copyDrawLayer = copyStage.findOne("#drawLayer");
        copyDrawLayer.hide();
        foreground.src = copyStage.toDataURL({ pixelRatio: 2 });
      }).then(() => {
        if (context !== null) {
          context.drawImage(foreground, 0, 0, output.width, output.height);
          return dataURItoBlob(canvas.toDataURL("image/png"));
        }
      });
    },
  };
};

const painter = inpainter();

export { painter };
