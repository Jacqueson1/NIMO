const { Live2DModel } = PIXI.live2d;

let app = null;
let model = null;

function fit() {
  if (!app || !model) return;
  const width = app.screen.width;
  const height = app.screen.height;
  model.scale.set(1);
  const scale = Math.min(width / model.width, height / model.height) * 0.95;
  model.scale.set(scale);
  model.anchor.set(0.5, 0.5);
  model.position.set(width / 2, height / 2);
}

export async function initAvatar(canvas) {
  Live2DModel.registerTicker(PIXI.Ticker);

  app = new PIXI.Application({
    view: canvas,
    resizeTo: canvas.parentElement,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  });

  model = await Live2DModel.from("models/mao/Mao.model3.json");
  app.stage.addChild(model);
  fit();

  window.addEventListener("resize", fit);
  window.addEventListener("pointermove", (e) => model.focus(e.clientX, e.clientY));

  return model;
}