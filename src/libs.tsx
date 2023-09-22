/* eslint-disable @typescript-eslint/no-namespace */
// import prompt from "image-prompt";

// const painter = prompt;
import Konva from "konva";

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

export function loadImage(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = path;
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (e) => {
      reject(e);
    };
  });
}

const imagePrompt = function () {
  const output = {
    width: 0,
    height: 0,
    image: null,
  };
  let history: Konva.Line[] = [];
  let historyStep = 0;

  const brushOptions = {
    strokeWidth: 30,
    strokeColor: "#ffffff",
  } as { strokeWidth: number; strokeColor: string };

  let drawingModeOn = false;
  let drawingMode: "brush" | "eraser" | "on" | "off" = "brush";
  let scale = 1;
  let stage = null as null | Konva.Stage;
  let drawLayer = null as null | Konva.Layer;
  let imageLayer = null as null | Konva.Layer;
  let cursorLayer = null as null | Konva.Layer;

  let cursorRing: Konva.Ring | null = null;
  let currentLine: Konva.Line | null = null;

  const containerSizeOption: {
    width: null | number;
    height: null | number;
  } = { width: null, height: null };

  const eventListener = new EventListeners();

  return {
    getStage() {
      return stage;
    },
    goTo(index: number) {
      if (drawLayer !== null && stage !== null) {
        history = history.filter((line, _) => {
          if (_ >= index) {
            line?.remove();
            return false;
          } else {
            if (drawLayer !== null) {
              drawLayer.add(line);
              return true;
            } else {
              return false;
            }
          }
        });

        drawLayer.batchDraw();
        historyStep = index;

        const copyStage = stage.clone();
        const cLayer = copyStage.findOne("#cursorLayer") as Konva.Layer;
        cLayer.remove();

        eventListener.dispatch("change", {
          cnt: historyStep,
          stage: copyStage?.toJSON(),
        });
      }
    },
    undo() {
      if (historyStep === 0 || stage === null) {
        return;
      }
      historyStep--;
      const lineToRemove = history[historyStep];
      if (lineToRemove !== undefined && drawLayer !== null) {
        lineToRemove.remove();
        drawLayer.batchDraw();

        const copyStage = stage.clone();
        const cLayer = copyStage.findOne("#cursorLayer") as Konva.Layer;
        cLayer.remove();

        eventListener.dispatch("change", {
          cnt: historyStep,
          stage: copyStage?.toJSON(),
        });
      }
    },
    redo() {
      if (historyStep === history.length || stage === null) {
        return;
      }

      const lineToRedraw = history[historyStep];
      if (lineToRedraw !== undefined && drawLayer !== null) {
        drawLayer.add(lineToRedraw);
        historyStep++;

        const copyStage = stage.clone();
        const cLayer = copyStage.findOne("#cursorLayer") as Konva.Layer;
        cLayer.remove();

        drawLayer.batchDraw();
        eventListener.dispatch("change", {
          cnt: historyStep,
          stage: copyStage?.toJSON(),
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
      111111111;
    },
    init: function ({
      container,
      brushOption,
      width,
      height,
      on,
      cache,
      containerSize,
    }: {
      container: string | HTMLDivElement;
      brushOption?: { strokeWidth: number; strokeColor: string };
      width?: number;
      height?: number;
      on?: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [eventType: string]: (arg: any) => void;
      };
      cache?: string;
      containerSize: {
        width: null | number;
        height: null | number;
      };
    }) {
      if (cache) {
        stage = Konva.Node.create(cache, container) as Konva.Stage;
        const iLayer = stage.findOne("#imageLayer") as Konva.Layer;
        const dLayer = stage.findOne("#drawLayer") as Konva.Layer;
        cursorLayer = new Konva.Layer({
          id: "cursorLayer",
        });

        cursorRing = new Konva.Ring({
          innerRadius: brushOptions.strokeWidth / 2 / scale,
          outerRadius: (brushOptions.strokeWidth / 2 + 3) / scale,
          fill: "#FFFFFF",
          id: "ring",
          stroke: "black",
          strokeWidth: 0.6,
        });

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
        cursorLayer = new Konva.Layer({
          id: "cursorLayer",
        });

        cursorRing = new Konva.Ring({
          innerRadius: brushOptions.strokeWidth / 2 / scale,
          outerRadius: (brushOptions.strokeWidth / 2 + 3) / scale,
          fill: "#FFFFFF",
          id: "ring",
          stroke: "black",
          strokeWidth: 0.6,
        });
      }

      stage.add(imageLayer);
      stage.add(drawLayer);
      stage.add(cursorLayer);
      cursorLayer.add(cursorRing);
      cursorLayer.hide();

      let isPaint = false;

      if (brushOption) {
        brushOptions.strokeColor = brushOption.strokeColor;
        brushOptions.strokeWidth = brushOption.strokeWidth;
      }

      containerSizeOption.width = containerSize.width;
      containerSizeOption.height = containerSize.height;

      stage.container().style.cursor = "none";

      stage.on("mousedown", () => {
        if (!drawingModeOn) return;
        isPaint = true;

        if (stage !== null) {
          const pointerPosition = stage.getPointerPosition();
          if (drawLayer !== null && pointerPosition !== null) {
            const x = (pointerPosition.x - drawLayer.x()) / scale;
            const y = (pointerPosition.y - drawLayer.y()) / scale;

            currentLine = new Konva.Line({
              stroke: brushOptions?.strokeColor,
              strokeWidth: brushOptions?.strokeWidth / scale,
              globalCompositeOperation:
                drawingMode === "brush" ? "source-over" : "destination-out",
              lineCap: "round",
              lineJoin: "round",
              points: [x, y, x, y],
            });

            drawLayer.add(currentLine);
          }
        }
      });

      stage.on("mousemove", ({ evt }) => {
        evt.preventDefault();
        if (stage !== null) {
          const pointerPosition = stage.getPointerPosition();

          if (
            drawLayer !== null &&
            pointerPosition !== null &&
            cursorRing !== null
          ) {
            const x = (pointerPosition.x - drawLayer.x()) / scale;
            const y = (pointerPosition.y - drawLayer.y()) / scale;

            cursorRing.x(x);
            cursorRing.y(y);

            if (!drawingModeOn) return;
            if (!isPaint) return;

            if (currentLine !== null) {
              currentLine.points(currentLine.points().concat([x, y]));
            }
          }
        }
      });

      stage.on("mouseup", () => {
        if (stage === null) return;
        if (!drawingModeOn) return;
        if (!isPaint) return;

        isPaint = false;

        if (currentLine !== null) {
          history = history.slice(0, historyStep);
          history.push(currentLine);
          historyStep++;

          const copyStage = stage.clone();
          const cLayer = copyStage.findOne("#cursorLayer") as Konva.Layer;
          cLayer.remove();

          eventListener.dispatch("change", {
            cnt: historyStep,
            stage: copyStage?.toJSON(),
          });
        }
      });

      if (on !== undefined) {
        Object.keys(on).forEach((eventName) => {
          eventListener.addEventListener(eventName, on[eventName]);
        });
      }

      if (container instanceof HTMLDivElement) {
        const divElement = container?.firstChild;
        divElement?.addEventListener("mouseenter", function () {
          if (cursorLayer !== null) {
            cursorLayer.show();
            cursorLayer.moveToTop();
          }
        });

        divElement?.addEventListener("mouseleave", function () {
          if (stage === null) return;
          if (cursorLayer !== null) cursorLayer.hide();
          if (!isPaint) return;
          if (!drawingModeOn) return;

          isPaint = false;

          if (currentLine !== null) {
            history = history.slice(0, historyStep + 1);
            history.push(currentLine);
            historyStep++;

            const copyStage = stage.clone();
            const cLayer = copyStage.findOne("#cursorLayer") as Konva.Layer;
            cLayer.remove();

            eventListener.dispatch("change", {
              cnt: historyStep,
              stage: copyStage?.toJSON(),
            });
          }
        });
      } else {
        const divElement = document.querySelector(container)?.firstChild;
        divElement?.addEventListener("mouseenter", function () {
          if (cursorLayer !== null) {
            cursorLayer.show();
            cursorLayer.moveToTop();
          }
        });

        divElement?.addEventListener("mouseleave", function () {
          if (stage === null) return;
          if (cursorLayer !== null) cursorLayer.hide();
          if (!isPaint) return;
          if (!drawingModeOn) return;

          isPaint = false;

          if (currentLine !== null) {
            history = history.slice(0, historyStep + 1);
            history.push(currentLine);
            historyStep++;

            const copyStage = stage.clone();
            const cLayer = copyStage.findOne("#cursorLayer") as Konva.Layer;
            cLayer.remove();

            eventListener.dispatch("change", {
              cnt: historyStep,
              stage: copyStage?.toJSON(),
            });
          }
        });
      }
    },
    async importImage({
      src,
      selectedWidth,
      selectedHeight,
    }: {
      src: string;
      selectedWidth: number;
      selectedHeight: number;
    }) {
      const { width: containerWidth, height: containerHeight } =
        containerSizeOption;

      const imageElement = (await loadImage(src)) as HTMLImageElement;

      if (
        stage === null ||
        imageLayer === null ||
        drawLayer === null ||
        containerWidth === null ||
        containerHeight === null ||
        cursorLayer === null
      )
        return;

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

      cursorLayer.position({ x, y });
      cursorLayer.scale({ x: scale, y: scale });
      cursorLayer.moveToTop();

      cursorRing?.innerRadius(brushOptions.strokeWidth / 2 / scale);
      cursorRing?.outerRadius((brushOptions.strokeWidth / 2 + 3) / scale);

      return base64;
    },
    exportImage() {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const foreground = new Image();

      canvas.width = output.width;
      canvas.height = output.height;

      return new Promise((resolve) => {
        foreground.onload = resolve;

        if (stage !== null) {
          const copyStage = stage.clone();
          const copyDrawLayer = copyStage.findOne("#drawLayer");
          copyDrawLayer.show();
          const copyCursorLayer = copyStage.findOne(
            "#cursorLayer"
          ) as Konva.Layer;
          copyCursorLayer.hide();

          foreground.src = copyStage.toDataURL({ pixelRatio: 2 });
        }
      }).then(() => {
        if (stage !== null && context !== null) {
          context.drawImage(foreground, 0, 0, output.width, output.height);
          const pngURL = canvas.toDataURL("image/png");
          return pngURL;
        }
      });
    },
    setStrokeColor(color: string) {
      brushOptions.strokeColor = color;
      if (!drawingModeOn || drawingMode === "eraser") return;
    },
    setStrokeWidth(width: number | string) {
      if (typeof width === "string") {
        brushOptions.strokeWidth = parseInt(width);
      } else {
        brushOptions.strokeWidth = width;
      }
      if (!drawingModeOn) return;
      if (cursorRing !== null) {
        cursorRing?.innerRadius(brushOptions.strokeWidth / 2 / scale);
        cursorRing?.outerRadius((brushOptions.strokeWidth / 2 + 3) / scale);
      }
    },
    setDrawingMode(mode: "brush" | "eraser" | "on" | "off") {
      if (stage !== null && drawLayer !== null && cursorLayer !== null) {
        if (mode === "off") {
          drawLayer.hide();
          drawingModeOn = false;
          stage.container().style.cursor = "not-allowed";
          cursorLayer.hide();
          return;
        } else if (mode === "on") {
          this.setDrawingMode(drawingMode);
          return;
        } else if (mode === "eraser") {
          drawingModeOn = true;
          drawLayer.show();
          stage.container().style.cursor = "none";

          if (cursorRing !== null) {
            cursorRing?.innerRadius(brushOptions.strokeWidth / 2 / scale);
            cursorRing?.outerRadius((brushOptions.strokeWidth / 2 + 3) / scale);
          }
        } else if (mode === "brush") {
          drawingModeOn = true;
          drawLayer.show();
          stage.container().style.cursor = "none";

          if (cursorRing !== null) {
            cursorRing?.innerRadius(brushOptions.strokeWidth / 2 / scale);
            cursorRing?.outerRadius((brushOptions.strokeWidth / 2 + 3) / scale);
          }
        }

        drawingMode = mode;
      }
    },
    deleteImage() {
      if (drawLayer !== null && imageLayer !== null && cursorLayer !== null) {
        drawLayer.destroyChildren();
        imageLayer.destroyChildren();
        cursorLayer.hide();
        history = [];
        historyStep = 0;
      }
    },
  };
};

const painter = imagePrompt();
export { painter };
