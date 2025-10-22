import spectral from "https://cdn.skypack.dev/spectral.js";

const colorInputs = [
  document.getElementById("color-1"),
  document.getElementById("color-2"),
  document.getElementById("color-3"),
];
const colorPickers = [];
const colorSamples = Array.from(
  document.querySelectorAll(".color-sample"),
);

const multiContainer = document.getElementById("multi-mix");
const mixBarsContainer = document.getElementById("mix-bars");
let multiCanvas = null;
let multiInfo = null;
let lastColors = [];

const BAR_STEPS = 40;

const PAIR_CONFIGS = [
  { indices: [0, 1], label: "カラー1 × カラー2" },
  { indices: [1, 2], label: "カラー2 × カラー3" },
  { indices: [0, 2], label: "カラー1 × カラー3" },
];

const pairStates = PAIR_CONFIGS.map(() => ({ ratio: 0.5 }));
let activePairIndex = 0;
function parseColor(value) {
  try {
    return new spectral.Color(value.trim());
  } catch (error) {
    throw new Error(`カラーコード "${value}" を解析できませんでした。`);
  }
}

function toHexString(value) {
  try {
    return new spectral.Color(value.trim())
      .toString({ format: "hex" })
      .toUpperCase();
  } catch (error) {
    return "#000000";
  }
}

function buildMixBars() {
  if (!mixBarsContainer) {
    return;
  }

  mixBarsContainer.innerHTML = "";

  PAIR_CONFIGS.forEach((pair, pairIndex) => {
    const bar = document.createElement("div");
    bar.className = "mix-bar";
    bar.dataset.pairIndex = pairIndex.toString();

    const label = document.createElement("div");
    label.className = "mix-bar-label";

    const labelText = document.createElement("span");
    labelText.className = "mix-bar-label-text";
    labelText.textContent = pair.label;

    const ratioValue = document.createElement("span");
    ratioValue.className = "mix-bar-label-value";
    ratioValue.dataset.pairIndex = pairIndex.toString();

    label.appendChild(labelText);
    label.appendChild(ratioValue);

    const track = document.createElement("div");
    track.className = "mix-bar-track";

    for (let i = 0; i <= BAR_STEPS; i += 1) {
      const step = document.createElement("span");
      step.className = "mix-bar-step";
      step.dataset.pairIndex = pairIndex.toString();
      step.dataset.stepIndex = i.toString();
      if (i === 0 || i === Math.round(BAR_STEPS / 2) || i === BAR_STEPS) {
        step.classList.add("marker");
      }
      track.appendChild(step);
    }

    bar.appendChild(label);
    bar.appendChild(track);

    mixBarsContainer.appendChild(bar);
  });

  mixBarsContainer.querySelectorAll(".mix-bar-step").forEach((step) => {
    step.addEventListener("click", handleBarStepClick);
  });
}

function handleBarStepClick(event) {
  const step = event.currentTarget;
  if (!(step instanceof HTMLElement)) {
    return;
  }

  const pairIndex = parseInt(step.dataset.pairIndex || "0", 10);
  const stepIndex = parseInt(step.dataset.stepIndex || "0", 10);

  const ratioSecond = stepIndex / BAR_STEPS;
  pairStates[pairIndex].ratio = ratioSecond;
  activePairIndex = pairIndex;

  updatePalette();
}

function updateMixBars(colors) {
  if (!mixBarsContainer) {
    return;
  }

  PAIR_CONFIGS.forEach((pair, pairIndex) => {
    const [firstIndex, secondIndex] = pair.indices;
    const firstColor = colors[firstIndex];
    const secondColor = colors[secondIndex];

    const bar = mixBarsContainer.querySelector(
      `.mix-bar[data-pair-index="${pairIndex}"]`,
    );
    const ratioDisplay = mixBarsContainer.querySelector(
      `.mix-bar-label-value[data-pair-index="${pairIndex}"]`,
    );

    if (bar) {
      bar.classList.toggle("active", pairIndex === activePairIndex);
    }

    if (ratioDisplay) {
      const ratioSecond = pairStates[pairIndex].ratio;
      const ratioFirst = 1 - ratioSecond;
      ratioDisplay.textContent = `${Math.round(ratioFirst * 100)} : ${Math.round(ratioSecond * 100)}`;
    }

    const steps = mixBarsContainer.querySelectorAll(
      `.mix-bar[data-pair-index="${pairIndex}"] .mix-bar-step`,
    );

    const selectedIndex = Math.round(pairStates[pairIndex].ratio * BAR_STEPS);

    steps.forEach((step, index) => {
      const stepIndex = parseInt(step.dataset.stepIndex || "0", 10);
      const ratioSecond = stepIndex / BAR_STEPS;
      const ratioFirst = 1 - ratioSecond;

      const mixArgs = [];
      if (ratioFirst > 0) {
        mixArgs.push([firstColor, ratioFirst]);
      }
      if (ratioSecond > 0) {
        mixArgs.push([secondColor, ratioSecond]);
      }

      const mixedColor =
        mixArgs.length > 0 ? spectral.mix(...mixArgs) : firstColor;
      const hex = mixedColor.toString({ format: "hex" });

      step.style.backgroundColor = hex;
      step.title = `カラー${firstIndex + 1} ${Math.round(ratioFirst * 100)}% / カラー${secondIndex + 1} ${Math.round(ratioSecond * 100)}% → ${hex.toUpperCase()}`;
      step.classList.toggle("selected", index === selectedIndex);
    });
  });
}

function buildMultiCanvas() {
  if (!multiContainer) {
    return;
  }

  multiContainer.innerHTML = "";

  multiCanvas = document.createElement("canvas");
  multiCanvas.className = "multi-mix-canvas";
  multiCanvas.setAttribute(
    "aria-label",
    "カラー1・カラー2・カラー3の混色を示す逆三角形グラデーション",
  );
  multiCanvas.setAttribute("role", "img");
  multiContainer.appendChild(multiCanvas);

  multiInfo = document.createElement("div");
  multiInfo.className = "multi-mix-info";
  multiInfo.hidden = true;
  multiContainer.appendChild(multiInfo);

  multiCanvas.addEventListener("mousemove", handleCanvasHover);
  multiCanvas.addEventListener("mouseleave", handleCanvasLeave);
}

function updateMultiMix(colors) {
  if (!multiContainer || !multiCanvas) {
    return;
  }

  const rect = multiContainer.getBoundingClientRect();
  const displayWidth =
    rect.width || multiContainer.clientWidth || multiContainer.offsetWidth;
  if (displayWidth === 0) {
    return;
  }

  const displayHeight = displayWidth * (Math.sqrt(3) / 2);
  const dpr = window.devicePixelRatio || 1;
  const pixelWidth = Math.max(1, Math.round(displayWidth * dpr));
  const pixelHeight = Math.max(1, Math.round(displayHeight * dpr));

  if (
    multiCanvas.width !== pixelWidth ||
    multiCanvas.height !== pixelHeight
  ) {
    multiCanvas.width = pixelWidth;
    multiCanvas.height = pixelHeight;
    multiCanvas.style.width = `${displayWidth}px`;
    multiCanvas.style.height = `${displayHeight}px`;
  }

  const context = multiCanvas.getContext("2d");
  if (!context) {
    return;
  }

  context.clearRect(0, 0, pixelWidth, pixelHeight);

  const triangle = {
    a: { x: 0, y: 0 },
    b: { x: pixelWidth, y: 0 },
    c: { x: pixelWidth / 2, y: pixelHeight },
  };

  const denom =
    (triangle.b.y - triangle.c.y) * (triangle.a.x - triangle.c.x) +
    (triangle.c.x - triangle.b.x) * (triangle.a.y - triangle.c.y);

  const step = Math.max(1, Math.floor(pixelWidth / 250));

  for (let y = 0; y < pixelHeight; y += step) {
    const patchHeight = Math.min(step, pixelHeight - y);
    for (let x = 0; x < pixelWidth; x += step) {
      const patchWidth = Math.min(step, pixelWidth - x);
      const sampleX = x + patchWidth / 2;
      const sampleY = y + patchHeight / 2;

      const w1 =
        ((triangle.b.y - triangle.c.y) * (sampleX - triangle.c.x) +
          (triangle.c.x - triangle.b.x) * (sampleY - triangle.c.y)) /
        denom;
      const w2 =
        ((triangle.c.y - triangle.a.y) * (sampleX - triangle.c.x) +
          (triangle.a.x - triangle.c.x) * (sampleY - triangle.c.y)) /
        denom;
      const w3 = 1 - w1 - w2;

      if (w1 < -0.001 || w2 < -0.001 || w3 < -0.001) {
        continue;
      }

      const weights = [w1, w2, w3].map((value) => Math.max(value, 0));
      const totalWeight = weights[0] + weights[1] + weights[2];

      if (totalWeight === 0) {
        continue;
      }

      const mixArgs = weights
        .map((weight, index) =>
          weight > 0 ? [colors[index], weight] : null,
        )
        .filter(Boolean);

      const mixedColor = spectral.mix(...mixArgs);
      const hex = mixedColor.toString({ format: "hex" });

      context.fillStyle = hex;
      context.fillRect(x, y, patchWidth, patchHeight);
    }
  }

  multiCanvas.removeAttribute("title");
  multiCanvas.setAttribute(
    "aria-description",
    `現在の入力値: ${colors
      .map((color) => color.toString({ format: "hex" }).toUpperCase())
      .join(", ")}`,
  );

  if (multiInfo) {
    multiInfo.hidden = true;
  }
}

function updatePalette() {
  let colors;
  try {
    colors = colorInputs.map((input) => parseColor(input.value));
  } catch (error) {
    console.warn(error.message);
    updateColorSamples();
    return;
  }

  lastColors = colors;
  updateMixBars(colors);
  updateMultiMix(colors);
  updateColorSamples();
}

colorInputs.forEach((input) =>
  input.addEventListener("change", updatePalette),
);

colorInputs.forEach((input, index) => {
  const hiddenPicker = document.createElement("input");
  hiddenPicker.type = "color";
  hiddenPicker.className = "hidden-color-input";
  input.parentElement?.appendChild(hiddenPicker);
  colorPickers.push(hiddenPicker);

  input.addEventListener("focus", () => {
    hiddenPicker.value = toHexString(input.value);
    requestAnimationFrame(() => {
      hiddenPicker.click();
    });
  });

  hiddenPicker.addEventListener("input", (event) => {
    const picker = event.target;
    if (!(picker instanceof HTMLInputElement)) {
      return;
    }
    const hex = picker.value.toUpperCase();
    input.value = hex;
    updatePalette();
  });
});

function updateColorSamples() {
  colorSamples.forEach((sample) => {
    const targetId = sample.dataset.sampleFor;
    const correspondingInput = colorInputs.find(
      (input) => input.id === targetId,
    );
    if (!correspondingInput) {
      return;
    }

    try {
      const color = new spectral.Color(correspondingInput.value.trim());
      const hex = color.toString({ format: "hex" });
      sample.style.backgroundColor = hex;
      sample.title = hex.toUpperCase();
    } catch (error) {
      sample.style.backgroundColor = "#ffffff";
      sample.title = "無効なカラーコード";
    }
  });
}

buildMixBars();
buildMultiCanvas();
updatePalette();

window.addEventListener("resize", () => {
  window.requestAnimationFrame(updatePalette);
});

function handleCanvasHover(event) {
  if (!multiCanvas || !multiInfo || lastColors.length !== 3) {
    return;
  }

  const rect = multiCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const scaleX = multiCanvas.width / (multiCanvas.clientWidth || 1);
  const scaleY = multiCanvas.height / (multiCanvas.clientHeight || 1);
  const sampleX = x * scaleX;
  const sampleY = y * scaleY;

  const triangle = {
    a: { x: 0, y: 0 },
    b: { x: multiCanvas.width, y: 0 },
    c: { x: multiCanvas.width / 2, y: multiCanvas.height },
  };
  const denom =
    (triangle.b.y - triangle.c.y) * (triangle.a.x - triangle.c.x) +
    (triangle.c.x - triangle.b.x) * (triangle.a.y - triangle.c.y);

  const w1 =
    ((triangle.b.y - triangle.c.y) * (sampleX - triangle.c.x) +
      (triangle.c.x - triangle.b.x) * (sampleY - triangle.c.y)) /
    denom;
  const w2 =
    ((triangle.c.y - triangle.a.y) * (sampleX - triangle.c.x) +
      (triangle.a.x - triangle.c.x) * (sampleY - triangle.c.y)) /
    denom;
  const w3 = 1 - w1 - w2;

  if (w1 < -0.001 || w2 < -0.001 || w3 < -0.001) {
    multiInfo.hidden = true;
    return;
  }

  const weights = [w1, w2, w3];
  const total = weights[0] + weights[1] + weights[2];
  if (total <= 0) {
    multiInfo.hidden = true;
    return;
  }

  const normalized = weights.map((weight) => weight / total);
  const mixArgs = normalized
    .map((weight, index) => (weight > 0 ? [lastColors[index], weight] : null))
    .filter(Boolean);

  const mixedColor = spectral.mix(...mixArgs);
  const hex = mixedColor.toString({ format: "hex" }).toUpperCase();
  const rawRatios = normalized.map((value) => value * 100);
  const ratios = rawRatios.map((value) => Math.max(0, Math.round(value)));
  const ratioSum = ratios[0] + ratios[1] + ratios[2];
  if (ratioSum !== 100) {
    const maxIndex = rawRatios.indexOf(Math.max(...rawRatios));
    ratios[maxIndex] = Math.max(0, ratios[maxIndex] + (100 - ratioSum));
  }

  multiInfo.textContent = `カラー1 ${ratios[0]}% / カラー2 ${ratios[1]}% / カラー3 ${ratios[2]}% → ${hex}`;
  multiInfo.style.left = `${x}px`;
  multiInfo.style.top = `${y}px`;
  multiInfo.hidden = false;
}

function handleCanvasLeave() {
  if (multiInfo) {
    multiInfo.hidden = true;
  }
}
