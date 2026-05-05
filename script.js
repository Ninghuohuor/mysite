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
  const readTextTypeContent = (content) => {
    const clone = content.cloneNode(true);
    clone.querySelectorAll("br").forEach((breakElement) => {
      breakElement.replaceWith("\n");
    });

    return clone.textContent.replace(/\n[ \t]+/g, "\n").trim();
  };
  const renderTextTypeCharacters = (content, characters) => {
    content.replaceChildren();

    let textNode = null;
    characters.forEach((character) => {
      if (character === "\n") {
        content.appendChild(document.createElement("br"));
        textNode = null;
        return;
      }

      if (!textNode) {
        textNode = document.createTextNode("");
        content.appendChild(textNode);
      }

      textNode.textContent += character;
    });
  };
  const splitGraphemes = (text) => {
    if (window.Intl?.Segmenter) {
      return Array.from(
        new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
        ({ segment }) => segment
      );
    }

    return Array.from(text);
  };

  document.querySelectorAll("[data-text-type]").forEach((element) => {
    const content = element.querySelector("[data-text-type-content]");
    if (!content) return;

    const textTypeSource = element.dataset.textType || readTextTypeContent(content);
    const sentences = textTypeSource.split("；").map((sentence) => sentence.trim()).filter(Boolean);
    const elementTypingSpeed = Number(element.dataset.textTypeSpeed) || typingSpeed;
    const mode = element.dataset.textTypeMode || "loop";

    if (!sentences.length) return;

    const sentenceCharacters = sentences.map(splitGraphemes);

    if (reduceMotion) {
      renderTextTypeCharacters(content, sentenceCharacters[0]);
      return;
    }

    if (mode === "once") {
      const characters = sentenceCharacters[0];
      let displayedCharacters = [];
      let hasStarted = false;

      const runOnce = () => {
        if (hasStarted) return;
        hasStarted = true;
        content.replaceChildren();

        const typeNextCharacter = () => {
          if (displayedCharacters.length < characters.length) {
            displayedCharacters.push(characters[displayedCharacters.length]);
            renderTextTypeCharacters(content, displayedCharacters);
            if (displayedCharacters.length >= characters.length) {
              element.classList.add("is-text-type-complete");
              return;
            }

            window.setTimeout(typeNextCharacter, elementTypingSpeed);
            return;
          }

          element.classList.add("is-text-type-complete");
        };

        typeNextCharacter();
      };

      content.replaceChildren();

      if (element.dataset.textTypeTrigger === "in-view" && "IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer.disconnect();
          runOnce();
        }, { threshold: 0.35 });
        observer.observe(element);
        return;
      }

      window.setTimeout(runOnce, 240);
      return;
    }

    let currentTextIndex = 0;
    let displayedCharacters = sentenceCharacters[currentTextIndex].slice();
    let isDeleting = true;

    const runTextType = () => {
      if (isDeleting) {
        if (displayedCharacters.length > 0) {
          displayedCharacters = displayedCharacters.slice(0, -1);
          content.textContent = displayedCharacters.join("");
          window.setTimeout(runTextType, deletingSpeed);
          return;
        }

        currentTextIndex = (currentTextIndex + 1) % sentences.length;
        displayedCharacters = [];
        isDeleting = false;
        window.setTimeout(runTextType, elementTypingSpeed);
        return;
      }

      const currentCharacters = sentenceCharacters[currentTextIndex];

      if (displayedCharacters.length < currentCharacters.length) {
        displayedCharacters.push(currentCharacters[displayedCharacters.length]);
        content.textContent = displayedCharacters.join("");
        window.setTimeout(runTextType, elementTypingSpeed);
        return;
      }

      isDeleting = true;
      window.setTimeout(runTextType, pauseDuration);
    };

    content.textContent = displayedCharacters.join("");
    window.setTimeout(runTextType, pauseDuration);
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

const initEnergyReveal = () => {
  const section = document.querySelector(".energy-section");
  if (!section) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add("is-in-view");
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -80px 0px" }
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
  let flowDistance = 1;
  let revealDistance = 1;

  const updateScrollDistance = () => {
    const viewportHeight = Math.max(window.innerHeight, 1);
    flowDistance = Math.max(1, track.scrollHeight - viewportHeight + viewportHeight * 0.12);
    const revealTail = viewportHeight;
    revealDistance = revealTail;
    section.style.setProperty("--principles-flow-distance", `${Math.round(flowDistance)}px`);
    section.style.setProperty("--principles-reveal-tail", `${revealTail}px`);
    return flowDistance;
  };

  const updateActiveSlide = () => {
    frameId = null;
    const rect = section.getBoundingClientRect();
    const elapsed = Math.min(flowDistance + revealDistance, Math.max(0, -rect.top));
    const flowElapsed = Math.min(flowDistance, elapsed);
    const progress = flowElapsed / flowDistance;
    const isBefore = rect.top > 1;
    const isRevealingDirection = elapsed >= flowDistance && elapsed < flowDistance + revealDistance;
    const isAfter = elapsed >= flowDistance + revealDistance;
    section.classList.toggle("is-principles-pinned", !isBefore && !isRevealingDirection && !isAfter);
    section.classList.toggle("is-principles-revealing-direction", isRevealingDirection);
    section.classList.toggle("is-principles-after", isAfter);
    stage.style.setProperty("--principles-flow-y", `${Math.round(progress * flowDistance * -1)}px`);
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

const initHobbyPreferences = () => {
  const root = document.querySelector("[data-hobby-preferences]");
  if (!root) return;

  const triggers = root.querySelectorAll("[data-hobby-target]");
  const images = root.querySelectorAll("[data-hobby-image]");
  if (!triggers.length || !images.length) return;

  const activate = (target) => {
    const nextImage = Array.from(images).find((image) => image.dataset.hobbyImage === target);
    const activeImage = Array.from(images).find((image) => image.classList.contains("is-active"));
    if (!nextImage) return;

    if (activeImage === nextImage) {
      triggers.forEach((trigger) => {
        trigger.classList.toggle("is-active", trigger.dataset.hobbyTarget === target);
      });
      return;
    }

    images.forEach((image) => {
      image.classList.remove("is-entering", "is-exiting");
      if (image !== nextImage && image !== activeImage) {
        image.classList.remove("is-active");
      }
    });

    if (activeImage) {
      activeImage.classList.remove("is-active");
      activeImage.classList.add("is-exiting");
      const clearExiting = () => {
        activeImage.classList.remove("is-exiting");
      };
      activeImage.addEventListener("transitionend", clearExiting, { once: true });
      window.setTimeout(clearExiting, 1240);
    }

    nextImage.classList.add("is-active", "is-entering");
    const clearEntering = () => {
      nextImage.classList.remove("is-entering");
    };
    nextImage.addEventListener("animationend", clearEntering, { once: true });
    window.setTimeout(clearEntering, 1240);

    triggers.forEach((trigger) => {
      trigger.classList.toggle("is-active", trigger.dataset.hobbyTarget === target);
    });
  };

  triggers.forEach((trigger) => {
    const target = trigger.dataset.hobbyTarget;
    if (!target) return;

    trigger.addEventListener("mouseenter", () => activate(target));
    trigger.addEventListener("focus", () => activate(target));
    trigger.addEventListener("click", () => activate(target));
  });
};

const initDirectionTopicMotion = () => {
  const section = document.querySelector("#direction");
  if (!section) return;

  const stage = section.querySelector(".direction-cover-stage");
  const single = section.querySelector(".direction-single");
  const copy = section.querySelector(".direction-copy");
  const directionAscii = section.querySelector("[data-direction-ascii-portrait]");
  const topics = Array.from(section.querySelectorAll(".direction-topic"));
  if (!stage || !single || !copy || !topics.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lastDirectionAsciiProgress = 0;

  const sendDirectionAsciiProgress = (progress) => {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    lastDirectionAsciiProgress = clampedProgress;
    if (!directionAscii) return;

    try {
      directionAscii.contentWindow?.postMessage({ type: "set-ascii-portrait-progress", progress: clampedProgress }, "*");
    } catch {
      // File previews are same-origin, but keep scroll behavior stable if iframe messaging is blocked.
    }
  };

  const updateContentHeight = () => {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
    const coverBuffer = viewportHeight;
    const contentHeight = Math.max(copy.scrollHeight, single.scrollHeight, coverBuffer);
    section.style.setProperty("--direction-content-height", `${Math.ceil(contentHeight + coverBuffer)}px`);
    return { contentHeight, coverBuffer };
  };

  const setTopicState = (topic, progress) => {
    const easedProgress = progress * progress * (3 - 2 * progress);
    topic.style.setProperty("--direction-topic-reveal", easedProgress.toFixed(3));
  };

  if (reduceMotion) {
    topics.forEach((topic) => setTopicState(topic, 1));
    sendDirectionAsciiProgress(1);
    return;
  }

  let frameId = null;

  const update = () => {
    frameId = null;
    const { contentHeight, coverBuffer } = updateContentHeight();

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
    const rect = section.getBoundingClientRect();
    const maxCoverY = Math.max(0, contentHeight - viewportHeight);
    const scrolledThroughSection = Math.max(0, -rect.top);
    const coverY = Math.min(maxCoverY, scrolledThroughSection);
    const directionModuleScrollDistance = Math.max(0, viewportHeight - rect.top);
    const directionAsciiBottom = Math.max(0, viewportHeight - rect.bottom);
    const directionAsciiActive = rect.top <= viewportHeight && rect.bottom >= 0;
    const finalRevealDistance = viewportHeight * 0.35;
    const finalRevealStart = Math.max(0, maxCoverY - finalRevealDistance);
    const finalRevealProgress = Math.max(0, Math.min(1, (scrolledThroughSection - finalRevealStart) / Math.max(1, maxCoverY - finalRevealStart)));
    section.style.setProperty("--direction-ascii-bottom", `${Math.round(directionAsciiBottom)}px`);
    section.style.setProperty("--direction-ascii-opacity", directionAsciiActive ? ".96" : "0");
    single.style.setProperty("--direction-cover-y", `${Math.round(coverY * -1)}px`);
    const revealStart = viewportHeight * 0.88;
    const revealEnd = viewportHeight * 0.34;
    const revealDistance = Math.max(1, revealStart - revealEnd);

    const lastTopic = topics[topics.length - 1];
    let lastTopicNaturalCompleteDistance = Number.POSITIVE_INFINITY;

    topics.forEach((topic) => {
      const rect = topic.getBoundingClientRect();
      const center = rect.top + rect.height * 0.44;
      const naturalProgress = Math.max(0, Math.min(1, (revealStart - center) / revealDistance));
      const forcedProgress = topic === lastTopic ? finalRevealProgress : 0;
      const progress = Math.max(naturalProgress, forcedProgress);
      if (topic === lastTopic) {
        lastTopicNaturalCompleteDistance = directionModuleScrollDistance + Math.max(0, center - revealEnd);
      }
      setTopicState(topic, progress);
    });

    const finalRevealCompleteDistance = viewportHeight + maxCoverY;
    const directionAsciiCompleteDistance = Math.max(1, Math.min(lastTopicNaturalCompleteDistance, finalRevealCompleteDistance));
    const directionAsciiProgress = Math.max(0, Math.min(1, directionModuleScrollDistance / directionAsciiCompleteDistance));
    sendDirectionAsciiProgress(directionAsciiProgress);
  };

  const requestUpdate = () => {
    if (frameId !== null) return;
    frameId = window.requestAnimationFrame(update);
  };

  updateContentHeight();
  update();
  directionAscii?.addEventListener("load", () => sendDirectionAsciiProgress(lastDirectionAsciiProgress));
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", () => {
    updateContentHeight();
    requestUpdate();
  });
  window.addEventListener("load", () => {
    updateContentHeight();
    requestUpdate();
  });
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

    let activeIntervalId = null;

    const resetEncryptedText = () => {
      spans.forEach((span, index) => {
        const letter = letters[index];
        const isSpace = letter === " ";
        span.textContent = isSpace ? letter : getRandomCharacter();
        span.classList.toggle("decrypted-text__char--encrypted", !isSpace);
      });
    };

    const reveal = () => {
      if (activeIntervalId !== null) {
        window.clearInterval(activeIntervalId);
        activeIntervalId = null;
      }

      const revealOrder = getRevealOrder(letters.length).filter((index) => letters[index] !== " ");
      const revealed = new Set();
      let pointer = 0;
      let tick = 0;

      resetEncryptedText();

      activeIntervalId = window.setInterval(() => {
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
          window.clearInterval(activeIntervalId);
          activeIntervalId = null;
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
runInit("anchor scroll", initAnchorScroll);
runInit("hobby preferences", initHobbyPreferences);
runInit("direction topic motion", initDirectionTopicMotion);
runInit("decrypted text", initDecryptedText);
runInit("wechat modal", initWechatModal);
runInit("principles reveal", initPrinciplesReveal);
runInit("energy reveal", initEnergyReveal);
runInit("principles scroll", initPrinciplesScroll);
runInit("principles decay cards", initPrinciplesDecayCards);

document.querySelector(".back-top")?.addEventListener("click", () => {
  syncPageScrollPosition(0);
  window.scrollTo({ top: 0, behavior: "smooth" });
});
