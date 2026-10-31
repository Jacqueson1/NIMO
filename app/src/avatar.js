const { Live2DModel } = PIXI.live2d;

const MODEL_PATH = "models/mao/Mao.model3.json";

let app = null;
let model = null;
let panel = null;

// talking state
let talking = false;
let mouth = 0;

export function setTalking(value) {
  talking = value;
}

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

function layout() {
  if (!app || !panel) return;
  const w = panel.clientWidth;
  const h = panel.clientHeight;
  if (!w || !h) return;
  app.renderer.resize(w, h); // resize first...
  fit();                     // ...then fit using the new size
}

function findLipSyncIds() {
  const groups = model.internalModel.settings.json?.Groups ?? [];
  const group = groups.find((g) => g.Name === "LipSync");
  return group?.Ids?.length ? group.Ids : ["ParamMouthOpenY"];
}

export async function initAvatar(canvas) {
  Live2DModel.registerTicker(PIXI.Ticker);
  panel = canvas.parentElement;

  app = new PIXI.Application({
    view: canvas,
    width: panel.clientWidth,
    height: panel.clientHeight,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  });

  model = await Live2DModel.from(MODEL_PATH);
  app.stage.addChild(model);
  layout();

  new ResizeObserver(layout).observe(panel);

  window.model = model; // temporary: lets us test things from DevTools

  const lipSyncIds = findLipSyncIds();
  console.log("Lip sync params:", lipSyncIds);

  // Mouth: runs every frame, after motions and before drawing
  model.internalModel.on("beforeModelUpdate", () => {
    const target = talking ? 0.25 + 0.55 * Math.abs(Math.sin(performance.now() / 90)) : 0;
    mouth += (target - mouth) * 0.35;
    for (const id of lipSyncIds) {
      model.internalModel.coreModel.setParameterValueById(id, mouth);
    }
  });

  window.addEventListener("pointermove", (e) => model.focus(e.clientX, e.clientY));

  return model;
}