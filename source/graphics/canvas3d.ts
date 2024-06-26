import { NotImplementedError } from "../error/NotImplementedError.js";
import { mustExist } from "../nil.js";
import { Canvas } from "./canvas.js";

/**
 * Construction options for a {@linkcode Canvas3D}.
 * @group Graphics
 * @group WebGL
 */
export interface Canvas3DOptions {}

/**
 * A canvas to interact with WebGL.
 * @group Graphics
 * @group WebGL
 */
export class Canvas3D extends Canvas {
  /**
   * The rendering context of the canvas.
   */
  #context: WebGL2RenderingContext;
  /**
   * Retrieves the rendering context of the canvas.
   * @returns The rendering context of the canvas.
   */
  get context(): WebGL2RenderingContext {
    return this.#context;
  }

  /**
   * The configuration that was used for this canvas.
   */
  readonly options: Readonly<Partial<Canvas3DOptions>>;

  /**
   * Constructs a new {@linkcode Canvas3D}.
   * @param canvas - The canvas to wrap.
   * @param options - The configuration for this canvas.
   */
  constructor(canvas: HTMLCanvasElement, options: Partial<Canvas3DOptions> = {}) {
    super(canvas);

    this.options = options;

    this.#context = mustExist(
      this.canvasElement.getContext("webgl2", {
        alpha: false,
      }),
      "Unable to create rendering context for offscreen canvas.",
    ) as WebGL2RenderingContext;
  }

  /**
   * Recreate internal buffers in reaction to a change in our target {@linkcode !HTMLCanvasElement}.
   */
  refreshCanvasNode() {
    this.#context = mustExist(
      this.canvasElement.getContext("webgl2", {
        alpha: false,
        desynchronized: true,
      }),
      "Unable to create rendering context for offscreen canvas.",
    ) as WebGL2RenderingContext;
  }

  /**
   * Does nothing.
   */
  update(): void {
    // There is nothing to do here.
  }
  /**
   * Does nothing.
   */
  render(): void {
    // There is nothing to do here.
  }

  /**
   * Not supported.
   * @param _color - Ignored
   */
  clearWith(_color: number): void {
    throw new NotImplementedError();
  }

  /**
   * Not supported.
   * @param _frameTimes - Ignored.
   * @param _frameTime - Ignored.
   * @param _timeDelta - Ignored.
   */
  renderFpsInfo(_frameTimes: Array<number>, _frameTime: number, _timeDelta: number): void {
    throw new NotImplementedError();
  }
}
