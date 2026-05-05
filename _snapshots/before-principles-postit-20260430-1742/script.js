const splitScrollRevealText = (element) => {
  if (element.dataset.scrollRevealReady === "true") return;

  const textRoot = element.querySelector(".scroll-reveal-text") || element;
  const walker = document.createTreeWalker(textRoot, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    if (walker.currentNode.textContent.trim()) {
      textNodes.push(walker.currentNode);
    }
  }

  textNodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    const text = node.textContent;

    text.split(/(\s+)/).forEach((word) => {
      if (!word) return;
      if (word.match(/^\s+$/)) {
        fragment.appendChild(document.createTextNode(word));
        return;
      }

      const span = document.createElement("span");
      span.className = "word";
      span.textContent = word;
      fragment.appendChild(span);
    });

    node.replaceWith(fragment);
  });

  element.dataset.scrollRevealReady = "true";
};

let scrollRevealRetryId = null;
let syncPageScrollPosition = () => {};

const initHeroVisibility = () => {
  const heroPin = document.querySelector(".hero-pin");
  if (!heroPin) return;

  let ticking = false;

  const update = () => {
    ticking = false;
    const heroBottom = heroPin.offsetTop + heroPin.offsetHeight;
    document.body.classList.toggle("is-past-hero", window.scrollY >= heroBottom - 1);
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
};

const initScrollReveal = () => {
  if (!window.gsap || !window.ScrollTrigger) {
    window.clearTimeout(scrollRevealRetryId);
    scrollRevealRetryId = window.setTimeout(initScrollReveal, 80);
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll("[data-scroll-reveal]").forEach((element) => {
    splitScrollRevealText(element);

    const scroller = window;
    const baseOpacity = Number(element.dataset.baseOpacity || 0.1);
    const baseRotation = Number(element.dataset.baseRotation || 3);
    const blurStrength = Number(element.dataset.blurStrength || 4);
    const enableBlur = element.dataset.enableBlur !== "false";
    const rotationEnd = element.dataset.rotationEnd || "bottom bottom";
    const wordAnimationEnd = element.dataset.wordAnimationEnd || "bottom bottom";
    const wordElements = element.querySelectorAll(".word");

    element.classList.add("scroll-reveal");

    gsap.fromTo(
      element,
      { transformOrigin: "0% 50%", rotate: baseRotation },
      {
        ease: "none",
        rotate: 0,
        scrollTrigger: {
          trigger: element,
          scroller,
          start: "top bottom",
          end: rotationEnd,
          scrub: true
        }
      }
    );

    if (wordElements.length) {
      gsap.fromTo(
        wordElements,
        { opacity: baseOpacity, willChange: "opacity" },
        {
          ease: "none",
          opacity: 1,
          stagger: 0.05,
          scrollTrigger: {
            trigger: element,
            scroller,
            start: "top bottom-=20%",
            end: wordAnimationEnd,
            scrub: true
          }
        }
      );

      if (enableBlur) {
        gsap.fromTo(
          wordElements,
          { filter: `blur(${blurStrength}px)` },
          {
            ease: "none",
            filter: "blur(0px)",
            stagger: 0.05,
            scrollTrigger: {
              trigger: element,
              scroller,
              start: "top bottom-=20%",
              end: wordAnimationEnd,
              scrub: true
            }
          }
        );
      }
    }

    element.dataset.scrollRevealAnimated = "true";
  });

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.ScrollTrigger?.refresh?.();
      syncHashTarget("auto");
    });
  });
};

const parseFontVariationSettings = (settings) => (
  settings.split(",")
    .map((setting) => setting.trim())
    .filter(Boolean)
    .map((setting) => {
      const [axis, value] = setting.split(/\s+/);
      return {
        axis: axis.replace(/['"]/g, ""),
        value: Number(value)
      };
    })
);

const calculateProximityFalloff = (distance, radius, falloff) => {
  const normalized = Math.min(Math.max(1 - distance / radius, 0), 1);

  if (falloff === "exponential") return normalized ** 2;
  if (falloff === "gaussian") return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
  return normalized;
};

const initVariableProximity = () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-variable-proximity]").forEach((element) => {
    if (element.dataset.variableProximityReady === "true") return;

    const label = element.dataset.variableLabel || element.textContent.trim();
    const fromSettings = element.dataset.fromFontVariationSettings || "'wght' 400, 'opsz' 9";
    const toSettings = element.dataset.toFontVariationSettings || "'wght' 800, 'opsz' 40";
    const radius = Number(element.dataset.variableRadius || 50);
    const falloff = element.dataset.variableFalloff || "linear";
    const fromParsed = parseFontVariationSettings(fromSettings);
    const toParsed = parseFontVariationSettings(toSettings);
    const targetByAxis = new Map(toParsed.map(({ axis, value }) => [axis, value]));
    const letterRefs = [];
    let letterIndex = 0;
    let mousePosition = { x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY };
    let variableProximityFrameId = null;

    element.textContent = "";
    element.classList.add("variable-proximity");
    element.setAttribute("aria-label", label);
    element.style.fontVariationSettings = fromSettings;

    const createLetterElement = (letter) => {
      const letterElement = document.createElement("span");
      letterElement.className = "variable-proximity-letter";
      letterElement.textContent = letter;
      letterElement.setAttribute("aria-hidden", "true");
      letterElement.style.fontVariationSettings = fromSettings;
      letterRefs[letterIndex] = letterElement;
      letterIndex += 1;
      return letterElement;
    };

    const words = label.split(" ");

    if (words.length === 1) {
      Array.from(label).forEach((letter) => {
        element.appendChild(createLetterElement(letter));
      });
    } else {
      words.forEach((word, wordIndex) => {
        const wordElement = document.createElement("span");
        wordElement.className = "variable-proximity-word";

        Array.from(word).forEach((letter) => {
          wordElement.appendChild(createLetterElement(letter));
        });

        element.appendChild(wordElement);

        if (wordIndex < words.length - 1) {
          const space = document.createElement("span");
          space.className = "variable-proximity-space";
          space.setAttribute("aria-hidden", "true");
          space.innerHTML = "&nbsp;";
          element.appendChild(space);
        }
      });
    }

    const screenReaderText = document.createElement("span");
    screenReaderText.className = "sr-only";
    screenReaderText.textContent = label;
    element.appendChild(screenReaderText);
    element.dataset.variableProximityReady = "true";

    if (reduceMotion) return;

    const updatePosition = (clientX, clientY) => {
      const rect = element.getBoundingClientRect();
      mousePosition = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };
    const handleMouseMove = (event) => {
      updatePosition(event.clientX, event.clientY);
      scheduleVariableProximityUpdate();
    };
    const handleTouchMove = (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      updatePosition(touch.clientX, touch.clientY);
      scheduleVariableProximityUpdate();
    };

    const animateVariableProximity = () => {
      variableProximityFrameId = null;
      const containerRect = element.getBoundingClientRect();

      letterRefs.forEach((letterElement) => {
        const rect = letterElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2 - containerRect.left;
        const centerY = rect.top + rect.height / 2 - containerRect.top;
        const distance = Math.hypot(mousePosition.x - centerX, mousePosition.y - centerY);

        if (distance >= radius) {
          letterElement.style.fontVariationSettings = fromSettings;
          return;
        }

        const amount = calculateProximityFalloff(distance, radius, falloff);
        const settings = fromParsed
          .map(({ axis, value }) => {
            const target = targetByAxis.get(axis) ?? value;
            const interpolated = value + (target - value) * amount;
            return `'${axis}' ${interpolated.toFixed(2)}`;
          })
          .join(", ");

        letterElement.style.fontVariationSettings = settings;
      });
    };

    const scheduleVariableProximityUpdate = () => {
      if (variableProximityFrameId !== null) return;
      variableProximityFrameId = window.requestAnimationFrame(animateVariableProximity);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
  });
};

const initClock = () => {
  const clock = document.querySelector("[data-clock]");
  if (!clock) return;

  const updateClock = () => {
    const time = new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(new Date());

    clock.textContent = time;
    clock.setAttribute("datetime", time);
  };

  updateClock();
  setInterval(updateClock, 1000);
};

const initTextType = () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const typingSpeed = 75;
  const deletingSpeed = 35;
  const pauseDuration = 1500;

  document.querySelectorAll("[data-text-type]").forEach((element) => {
    const sentences = element.dataset.textType.split("；").map((sentence) => sentence.trim()).filter(Boolean);
    const content = element.querySelector("[data-text-type-content]");

    if (!sentences.length || !content) return;

    if (reduceMotion) {
      content.textContent = sentences[0];
      return;
    }

    let currentTextIndex = 0;
    let displayedText = sentences[currentTextIndex];
    let isDeleting = true;

    const runTextType = () => {
      if (isDeleting) {
        if (displayedText.length > 0) {
          displayedText = displayedText.slice(0, -1);
          content.textContent = displayedText;
          window.setTimeout(runTextType, deletingSpeed);
          return;
        }

        currentTextIndex = (currentTextIndex + 1) % sentences.length;
        isDeleting = false;
        window.setTimeout(runTextType, typingSpeed);
        return;
      }

      const currentSentence = sentences[currentTextIndex];

      if (displayedText.length < currentSentence.length) {
        displayedText += currentSentence[displayedText.length];
        content.textContent = displayedText;
        window.setTimeout(runTextType, typingSpeed);
        return;
      }

      isDeleting = true;
      window.setTimeout(runTextType, pauseDuration);
    };

    content.textContent = displayedText;
    window.setTimeout(runTextType, pauseDuration);
  });
};

const initProjectSpiral = () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const projectSpiralBaseItems = [
    { text: "Ninglo", desc: "帮助从0到1理解 AI、使用 AI。" },
    { text: "Vibix", desc: "随时随地记录碎片化灵感" },
    { text: "Solobiz0", desc: "内容创作自动化工作流" },
    { text: "Levix", desc: "人生游戏化管理工具" },
    { text: "Gloopix", desc: "AI 图片与视频创作" }
  ];
  const totalItems = 300;
  const startIndex = 150;
  const autoDelay = 2500;
  const itemSpacing = 22;
  const renderRadius = 8;
  const spring = {
    damping: 24,
    stiffness: 90,
    mass: 1
  };
  const interpolate = (value, input, output) => {
    if (value <= input[0]) return output[0];
    const lastIndex = input.length - 1;
    if (value >= input[lastIndex]) return output[lastIndex];

    for (let index = 0; index < lastIndex; index += 1) {
      const start = input[index];
      const end = input[index + 1];
      if (value < start || value > end) continue;
      const amount = (value - start) / (end - start || 1);
      return output[index] + (output[index + 1] - output[index]) * amount;
    }

    return output[lastIndex];
  };
  const mixColor = (from, to, amount) => {
    const next = from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount));
    return `rgb(${next[0]}, ${next[1]}, ${next[2]})`;
  };
  const positiveModulo = (value, length) => ((value % length) + length) % length;
  const getItem = (index) => projectSpiralBaseItems[positiveModulo(index, projectSpiralBaseItems.length)];
  const setItemColor = (item, offset) => {
    const titleAmount = interpolate(Math.abs(offset), [0, 0.2, 1], [1, 0, 0]);
    const descAmount = interpolate(Math.abs(offset), [0, 0.2, 1], [1, 0, 0]);
    item.style.setProperty("--project-spiral-color", mixColor([107, 114, 128], [0, 0, 0], titleAmount));
    item.style.setProperty("--project-spiral-desc-color", mixColor([209, 213, 219], [107, 114, 128], descAmount));
  };

  document.querySelectorAll("[data-project-spiral]").forEach((stage) => {
    if (stage.dataset.projectSpiralReady === "true") return;
    const track = stage.querySelector(".project-spiral-track");
    const arrow = stage.querySelector("[data-project-spiral-arrow]");
    if (!track) return;

    let progress = startIndex;
    let targetProgress = startIndex;
    let velocity = 0;
    let lastFrameTime = 0;
    let frameId = null;
    let autoTimer = null;
    let isActive = false;
    let hasStarted = false;
    let arrowPushTimer = null;
    let isTransitioning = false;
    let completedSteps = 0;
    const pushDuration = 640;
    const renderedItems = new Map();

    const createSpiralItem = (index) => {
      const itemData = getItem(index);
      const item = document.createElement("article");
      const title = document.createElement("span");
      const desc = document.createElement("span");

      item.className = "project-spiral-item";
      item.dataset.projectSpiralItem = "";
      item.dataset.spiralIndex = String(index);
      item.style.transformOrigin = "right center";
      title.className = "project-spiral-title";
      title.textContent = itemData.text;
      desc.className = "project-spiral-desc";
      desc.textContent = itemData.desc;
      item.append(title, desc);
      return item;
    };

    const reconcileItems = () => {
      const center = Math.round(targetProgress);
      const nextIndexes = new Set();
      const visibleHistoryDepth = Math.min(renderRadius, completedSteps);
      const firstIndex = center - visibleHistoryDepth;
      for (let index = firstIndex; index <= center + renderRadius; index += 1) {
        const normalizedIndex = ((index % totalItems) + totalItems) % totalItems;
        nextIndexes.add(index);
        if (renderedItems.has(index)) continue;
        const item = createSpiralItem(normalizedIndex);
        renderedItems.set(index, item);
        track.append(item);
      }

      renderedItems.forEach((item, index) => {
        if (nextIndexes.has(index)) return;
        item.remove();
        renderedItems.delete(index);
      });
    };

    const updateItems = () => {
      reconcileItems();
      renderedItems.forEach((item, index) => {
        const offset = index - progress;
        const y = offset * itemSpacing;
        const rotateY = offset * -32;
        const rotateZ = offset * -6;
        const rotateX = offset * 5;
        const opacity = !hasStarted && offset < -0.08
          ? 0
          : reduceMotion
            ? 1
            : interpolate(offset, [-4, -1.8, 0, 1.8, 4], [0, 0.25, 1, 0.25, 0]);

        item.classList.toggle("is-current", Math.abs(offset) < 0.25);
        item.style.setProperty("--project-spiral-y", `${y}vh`);
        item.style.setProperty("--project-spiral-rotate-x", `${rotateX}deg`);
        item.style.setProperty("--project-spiral-rotate-y", `${rotateY}deg`);
        item.style.setProperty("--project-spiral-rotate-z", `${rotateZ}deg`);
        item.style.setProperty("--project-spiral-opacity", opacity.toFixed(3));
        setItemColor(item, offset);
      });
    };

    const renderFrame = (timestamp) => {
      frameId = null;
      const deltaSeconds = Math.min((timestamp - lastFrameTime) / 1000 || 1 / 60, 0.05);
      lastFrameTime = timestamp;

      if (!reduceMotion) {
        const acceleration = ((targetProgress - progress) * spring.stiffness) / spring.mass;
        velocity = (velocity + acceleration * deltaSeconds) * Math.exp(-spring.damping * deltaSeconds);
        progress += velocity * deltaSeconds;

        if (Math.abs(targetProgress - progress) < 0.001 && Math.abs(velocity) < 0.001) {
          progress = targetProgress;
          velocity = 0;
        }
      }

      updateItems();
      if (isActive && !reduceMotion && progress !== targetProgress) {
        frameId = window.requestAnimationFrame(renderFrame);
      }
    };

    const scheduleFrame = () => {
      if (frameId !== null) return;
      lastFrameTime = performance.now();
      frameId = window.requestAnimationFrame(renderFrame);
    };

    const triggerArrowPush = () => {
      if (!arrow || reduceMotion) return Promise.resolve();
      window.clearTimeout(arrowPushTimer);
      arrow.classList.remove("is-pushing");
      stage.classList.remove("is-pushing");
      void arrow.offsetWidth;
      arrow.classList.add("is-pushing");
      stage.classList.add("is-pushing");
      return new Promise((resolve) => {
        arrowPushTimer = window.setTimeout(() => {
          arrow.classList.remove("is-pushing");
          stage.classList.remove("is-pushing");
          resolve();
        }, pushDuration);
      });
    };

    const applyProgressStep = (direction) => {
      completedSteps = Math.min(renderRadius, completedSteps + Math.abs(direction));
      targetProgress += direction;
      if (targetProgress < renderRadius) {
        targetProgress += totalItems - renderRadius * 2;
        progress += totalItems - renderRadius * 2;
      } else if (targetProgress > totalItems - renderRadius) {
        targetProgress -= totalItems - renderRadius * 2;
        progress -= totalItems - renderRadius * 2;
      }
      scheduleFrame();
    };

    const stepProgress = async (direction) => {
      if (isTransitioning) return;
      isTransitioning = true;
      await triggerArrowPush();
      if (isActive && hasStarted) {
        applyProgressStep(direction);
      }
      isTransitioning = false;
    };

    const stopAutoScroll = () => {
      if (!autoTimer) return;
      window.clearTimeout(autoTimer);
      autoTimer = null;
    };

    const startAutoScroll = () => {
      if (reduceMotion || autoTimer || !hasStarted) return;
      autoTimer = window.setTimeout(async () => {
        autoTimer = null;
        await stepProgress(1);
        if (isActive && hasStarted) {
          startAutoScroll();
        }
      }, autoDelay);
    };

    const setStarted = (nextStarted) => {
      if (hasStarted === nextStarted) return;
      hasStarted = nextStarted;
      stage.classList.toggle("is-started", hasStarted);

      if (!hasStarted) {
        stopAutoScroll();
        targetProgress = startIndex;
        progress = startIndex;
        velocity = 0;
        completedSteps = 0;
      } else {
        startAutoScroll();
      }

      scheduleFrame();
    };

    const syncStartedToScroll = () => {
      const startLine = window.innerHeight * 0.56;
      const rect = stage.getBoundingClientRect();
      setStarted(rect.top <= startLine && rect.bottom > 0);
    };

    const setActive = (nextActive) => {
      isActive = nextActive;
      stage.classList.toggle("is-active", isActive);
      if (isActive) {
        syncStartedToScroll();
        scheduleFrame();
        return;
      }

      stopAutoScroll();
      setStarted(false);
    };

    stage.dataset.projectSpiralReady = "true";
    updateItems();

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => setActive(entry.isIntersecting));
        },
        { threshold: [0, 0.01, 0.25, 0.6] }
      );
      observer.observe(stage);
    } else {
      setActive(true);
    }

    window.addEventListener("scroll", syncStartedToScroll, { passive: true });
    window.addEventListener("resize", syncStartedToScroll);
  });
};

const initPrinciplesReveal = () => {
  const section = document.querySelector(".selected-projects");
  if (!section) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add("is-in-view");
        }
      });
    },
    { threshold: 0.02, rootMargin: "0px 0px -60px 0px" }
  );

  observer.observe(section);
};

const initPrinciplesScroll = () => {
  const section = document.querySelector(".selected-projects");
  const stage = document.querySelector("[data-principles-scroll-stage]");
  const track = stage?.querySelector(".principles-track");
  if (!section || !stage) return;

  const slides = Array.from(stage.querySelectorAll("[data-principles-slide]"));
  if (!slides.length || !track) return;
  let frameId = null;

  const updateScrollDistance = () => {
    const viewportHeight = Math.max(window.innerHeight, 1);
    const flowDistance = Math.max(1, track.scrollHeight - viewportHeight + viewportHeight * 0.12);
    section.style.setProperty("--principles-flow-distance", `${Math.round(flowDistance)}px`);
    return flowDistance;
  };

  const updateActiveSlide = () => {
    frameId = null;
    const rect = section.getBoundingClientRect();
    const viewportHeight = Math.max(window.innerHeight, 1);
    const scrollableDistance = Math.max(section.offsetHeight - viewportHeight, 1);
    const elapsed = Math.min(scrollableDistance, Math.max(0, -rect.top));
    const progress = elapsed / scrollableDistance;
    const isBefore = rect.top > 1;
    const isAfter = rect.bottom <= viewportHeight + 1;
    section.classList.toggle("is-principles-pinned", !isBefore && !isAfter);
    section.classList.toggle("is-principles-after", isAfter);
    stage.style.setProperty("--principles-flow-y", `${Math.round(progress * scrollableDistance * -1)}px`);
  };

  const requestUpdate = () => {
    if (frameId) return;
    frameId = window.requestAnimationFrame(updateActiveSlide);
  };

  updateScrollDistance();
  updateActiveSlide();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", () => {
    updateScrollDistance();
    requestUpdate();
  });
  window.addEventListener("hashchange", requestUpdate);
  window.addEventListener("load", () => {
    updateScrollDistance();
    requestUpdate();
  });
  window.setTimeout(() => {
    updateScrollDistance();
    requestUpdate();
  }, 80);
};

const initPrinciplesDecayCards = () => {
  const cards = Array.from(document.querySelectorAll("[data-principles-decay-card]"));
  if (!cards.length || !window.gsap) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const svgNamespace = "http://www.w3.org/2000/svg";
  const filterHost = document.createElementNS(svgNamespace, "svg");
  filterHost.classList.add("principles-decay-filters");
  filterHost.setAttribute("aria-hidden", "true");
  document.body.appendChild(filterHost);

  const cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const cachedCursor = { ...cursor };
  const winsize = { width: window.innerWidth, height: window.innerHeight };
  const imgValues = { x: 0, y: 0, rz: 0, displacementScale: 0 };
  const displacements = [];
  const maxDisplacement = 220;
  const movementBound = 34;

  const lerp = (a, b, n) => (1 - n) * a + n * b;
  const map = (value, a, b, c, d) => {
    const range = b - a || 1;
    return ((value - a) * (d - c)) / range + c;
  };
  const distance = (x1, x2, y1, y2) => Math.hypot(x1 - x2, y1 - y2);
  const softenBound = (value) => {
    if (value > movementBound) return movementBound + (value - movementBound) * 0.2;
    if (value < -movementBound) return -movementBound + (value + movementBound) * 0.2;
    return value;
  };

  cards.forEach((card, index) => {
    const image = card.querySelector("img");
    if (!image) return;

    const filter = document.createElementNS(svgNamespace, "filter");
    const filterId = `principles-decay-filter-${index}`;
    filter.setAttribute("id", filterId);
    filter.setAttribute("x", "-20%");
    filter.setAttribute("y", "-20%");
    filter.setAttribute("width", "140%");
    filter.setAttribute("height", "140%");

    const turbulence = document.createElementNS(svgNamespace, "feTurbulence");
    turbulence.setAttribute("type", "turbulence");
    turbulence.setAttribute("baseFrequency", "0.015");
    turbulence.setAttribute("numOctaves", "5");
    turbulence.setAttribute("seed", String(4 + index));
    turbulence.setAttribute("stitchTiles", "stitch");
    turbulence.setAttribute("result", "turbulence");

    const displacement = document.createElementNS(svgNamespace, "feDisplacementMap");
    displacement.setAttribute("in", "SourceGraphic");
    displacement.setAttribute("in2", "turbulence");
    displacement.setAttribute("scale", "0");
    displacement.setAttribute("xChannelSelector", "R");
    displacement.setAttribute("yChannelSelector", "B");
    displacement.dataset.principlesDecayDisplacement = "true";

    filter.append(turbulence, displacement);
    filterHost.appendChild(filter);
    image.style.filter = `url(#${filterId})`;
    image.classList.add("principles-decay-image");
    displacements.push(displacement);
  });

  const handleResize = () => {
    winsize.width = window.innerWidth;
    winsize.height = window.innerHeight;
  };

  const handleMouseMove = (event) => {
    cursor.x = event.clientX;
    cursor.y = event.clientY;
  };

  const render = () => {
    const targetX = softenBound(lerp(imgValues.x, map(cursor.x, 0, winsize.width, -120, 120), 0.1));
    const targetY = softenBound(lerp(imgValues.y, map(cursor.y, 0, winsize.height, -120, 120), 0.1));
    const targetRz = lerp(imgValues.rz, map(cursor.x, 0, winsize.width, -10, 10), 0.1);

    imgValues.x = targetX;
    imgValues.y = targetY;
    imgValues.rz = targetRz;

    window.gsap.set(cards, {
      "--decay-x": `${imgValues.x}px`,
      "--decay-y": `${imgValues.y}px`,
      "--decay-rz": `${imgValues.rz}deg`
    });

    const cursorTravelledDistance = distance(cachedCursor.x, cursor.x, cachedCursor.y, cursor.y);
    imgValues.displacementScale = lerp(
      imgValues.displacementScale,
      map(cursorTravelledDistance, 0, 200, 0, maxDisplacement),
      0.06
    );

    window.gsap.set(displacements, { attr: { scale: imgValues.displacementScale } });
    cachedCursor.x = cursor.x;
    cachedCursor.y = cursor.y;
    window.requestAnimationFrame(render);
  };

  window.addEventListener("resize", handleResize);
  window.addEventListener("mousemove", handleMouseMove, { passive: true });
  window.requestAnimationFrame(render);
};

const initTiltedCard = () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  document.querySelectorAll("[data-tilted-card]").forEach((card) => {
    const inner = card.querySelector(".tilted-card-inner");
    const caption = card.querySelector(".tilted-card-caption");
    const rotateAmplitude = Number(card.dataset.rotateAmplitude || 14);
    const scaleOnHover = Number(card.dataset.scaleOnHover || 1.1);

    if (!inner || reduceMotion || coarsePointer) return;

    let lastY = 0;

    const resetCard = () => {
      inner.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
      if (caption) {
        caption.style.opacity = "0";
        caption.style.transform = "translate3d(0, 0, 32px) rotate(0deg)";
      }
    };

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const offsetX = event.clientX - rect.left - rect.width / 2;
      const offsetY = event.clientY - rect.top - rect.height / 2;
      const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
      const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;
      const captionRotation = -(offsetY - lastY) * 0.6;

      inner.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale(${scaleOnHover})`;

      if (caption) {
        caption.style.opacity = "1";
        caption.style.transform = `translate3d(${event.clientX - rect.left}px, ${event.clientY - rect.top}px, 32px) rotate(${captionRotation}deg)`;
      }

      lastY = offsetY;
    });

    card.addEventListener("pointerenter", () => {
      inner.style.transform = `rotateX(0deg) rotateY(0deg) scale(${scaleOnHover})`;
      if (caption) caption.style.opacity = "1";
    });

    card.addEventListener("pointerleave", resetCard);
    card.addEventListener("pointercancel", resetCard);
  });
};

const initCursorFollower = () => {
  const follower = document.querySelector("[data-cursor-follower]");
  const prefersCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!follower || prefersCoarsePointer || reduceMotion) return;

  const followerOffset = { x: 14, y: 18 };
  const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const current = { ...target };
  let rafId = null;
  let isVisible = false;

  const render = () => {
    current.x += (target.x - current.x) * 0.18;
    current.y += (target.y - current.y) * 0.18;
    follower.style.transform = `translate3d(${current.x + followerOffset.x}px, ${current.y + followerOffset.y}px, 0) translate(-50%, -50%) scale(${isVisible ? 1 : 0.72})`;
    rafId = requestAnimationFrame(render);
  };

  const startRenderLoop = () => {
    if (rafId === null) {
      rafId = requestAnimationFrame(render);
    }
  };

  const stopRenderLoop = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const show = () => {
    isVisible = true;
    follower.classList.add("is-visible");
    startRenderLoop();
  };

  const hide = () => {
    isVisible = false;
    follower.classList.remove("is-visible");
  };

  const handlePointerMove = (event) => {
    target.x = event.clientX;
    target.y = event.clientY;
    show();
  };

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerleave", hide);
  window.addEventListener("blur", hide);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopRenderLoop();
      return;
    }

    if (isVisible) startRenderLoop();
  });
};

const scrollToHashTarget = (hash = window.location.hash, behavior = "smooth") => {
  if (!hash || hash === "#") return;

  let target = null;

  try {
    target = document.querySelector(hash);
  } catch (_) {
    return;
  }

  if (!target) return;

  window.requestAnimationFrame(() => {
    const heroPin = document.querySelector(".hero-pin");
    let top = target.getBoundingClientRect().top + window.scrollY;

    if (target.classList.contains("hero-page") && heroPin) {
      top = heroPin.offsetTop;
    } else if (target.id === "direction") {
      top += window.innerHeight;
    }

    syncPageScrollPosition(top);
    window.scrollTo({ top, behavior });
  });
};

const syncHashTarget = (behavior = "auto") => {
  const { hash } = window.location;
  if (!hash || hash === "#") return;

  scrollToHashTarget(hash, behavior);
  window.setTimeout(() => scrollToHashTarget(hash, "auto"), 160);
  window.setTimeout(() => scrollToHashTarget(hash, "auto"), 520);
};

const initAnchorScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;

      let target = null;

      try {
        target = document.querySelector(hash);
      } catch (_) {
        return;
      }

      if (!target) return;

      event.preventDefault();
      history.replaceState(null, "", window.location.pathname + window.location.search);
      window.requestAnimationFrame(() => scrollToHashTarget(hash));
    });
  });

  window.addEventListener("hashchange", () => syncHashTarget("smooth"));
  window.addEventListener("load", () => syncHashTarget("auto"), { once: true });
  syncHashTarget("auto");
};

const initDirectionReveal = () => {
  const direction = document.querySelector("#direction");
  const content = direction?.querySelector(".direction-reveal-content");
  if (!direction || !content) return;

  let frameId = null;

  const update = () => {
    frameId = null;
    const viewportHeight = Math.max(window.innerHeight, 1);
    const extraContentHeight = Math.max(content.scrollHeight - viewportHeight, 0);
    direction.style.setProperty("--direction-copy-height", `${extraContentHeight}px`);
    const directionTop = direction.getBoundingClientRect().top + window.scrollY;
    const revealEnd = directionTop + viewportHeight;
    const scrollY = window.scrollY;
    const isActive = scrollY >= directionTop && scrollY < revealEnd;
    const isAfter = scrollY >= revealEnd;

    direction.classList.toggle("is-direction-reveal-active", isActive);
    direction.classList.toggle("is-direction-reveal-after", isAfter);
  };

  const requestUpdate = () => {
    if (frameId) return;
    frameId = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
};

const initWechatModal = () => {
  const modal = document.querySelector("[data-wechat-modal]");
  const openButton = document.querySelector("[data-wechat-modal-open]");
  const closeButtons = document.querySelectorAll("[data-wechat-modal-close]");

  if (!modal || !openButton || !closeButtons.length) return;

  let previousFocus = null;

  const openModal = () => {
    previousFocus = document.activeElement;
    modal.hidden = false;
    document.documentElement.classList.add("is-wechat-modal-open");
    modal.querySelector("[data-wechat-modal-close]")?.focus?.();
  };

  const closeModal = () => {
    modal.hidden = true;
    document.documentElement.classList.remove("is-wechat-modal-open");
    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
  };

  openButton.addEventListener("click", openModal);
  closeButtons.forEach((button) => button.addEventListener("click", closeModal));

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });
};

const initDecryptedText = () => {
  const elements = document.querySelectorAll("[data-decrypted-text]");
  if (!elements.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const speed = 34;

  const getRevealOrder = (length) => {
    const order = [];
    const center = Math.floor(length / 2);
    let offset = 0;

    while (order.length < length) {
      const index = offset % 2 === 0
        ? center + offset / 2
        : center - Math.ceil(offset / 2);

      if (index >= 0 && index < length) {
        order.push(index);
      }

      offset += 1;
    }

    return order;
  };

  const getRandomCharacter = () => characters[Math.floor(Math.random() * characters.length)];

  elements.forEach((element) => {
    if (element.dataset.decryptedTextReady === "true") return;

    const originalText = element.textContent;
    const letters = Array.from(originalText);

    element.dataset.decryptedTextReady = "true";

    if (reduceMotion || letters.length === 0) return;

    element.classList.add("decrypted-text");
    element.textContent = "";

    const screenReaderText = document.createElement("span");
    screenReaderText.className = "sr-only";
    screenReaderText.textContent = originalText;
    element.appendChild(screenReaderText);

    const visibleText = document.createElement("span");
    visibleText.className = "decrypted-text__visible";
    visibleText.setAttribute("aria-hidden", "true");
    element.appendChild(visibleText);

    const spans = letters.map((letter) => {
      const span = document.createElement("span");
      span.className = "decrypted-text__char";
      span.textContent = letter;
      visibleText.appendChild(span);
      return span;
    });

    const reveal = () => {
      const revealOrder = getRevealOrder(letters.length).filter((index) => letters[index] !== " ");
      const revealed = new Set();
      let pointer = 0;
      let tick = 0;

      const intervalId = window.setInterval(() => {
        tick += 1;

        if (tick > 1 && pointer < revealOrder.length) {
          revealed.add(revealOrder[pointer]);
          pointer += 1;
        }

        spans.forEach((span, index) => {
          const letter = letters[index];
          const isRevealed = letter === " " || revealed.has(index) || pointer >= revealOrder.length;
          span.textContent = isRevealed ? letter : getRandomCharacter();
          span.classList.toggle("decrypted-text__char--encrypted", !isRevealed);
        });

        if (pointer >= revealOrder.length) {
          window.clearInterval(intervalId);
          spans.forEach((span, index) => {
            span.textContent = letters[index];
            span.classList.remove("decrypted-text__char--encrypted");
          });
        }
      }, speed);
    };

    if (!("IntersectionObserver" in window)) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal();
        observer.disconnect();
      });
    }, { threshold: 0.35 });

    observer.observe(element);
  });
};

const runInit = (name, init) => {
  try {
    init();
  } catch (error) {
    console.error(`[init:${name}] failed`, error);
  }
};

runInit("scroll reveal", initScrollReveal);
runInit("hero visibility", initHeroVisibility);
runInit("variable proximity", initVariableProximity);
runInit("clock", initClock);
runInit("text type", initTextType);
runInit("tilted card", initTiltedCard);
runInit("cursor follower", initCursorFollower);
runInit("project spiral", initProjectSpiral);
runInit("anchor scroll", initAnchorScroll);
runInit("direction reveal", initDirectionReveal);
runInit("decrypted text", initDecryptedText);
runInit("wechat modal", initWechatModal);
runInit("principles reveal", initPrinciplesReveal);
runInit("principles scroll", initPrinciplesScroll);
runInit("principles decay cards", initPrinciplesDecayCards);

document.querySelectorAll(".accordion-list button").forEach((button) => {
  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    button.querySelector("span:last-child").textContent = expanded ? "+" : "-";
  });
});

document.querySelector(".back-top")?.addEventListener("click", () => {
  syncPageScrollPosition(0);
  window.scrollTo({ top: 0, behavior: "smooth" });
});
