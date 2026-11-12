import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Carousel, KeyboardTextarea, MobileScroll, useKeyboard, useKeyboardInsets } from "./mobile";
import { scriptures as builtInScriptures } from "./scriptureData";

type Scripture = {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  introduction: string;
  cover: string;
  lines: string[];
  isCustom?: boolean;
};

type Screen = "home" | "library" | "achievements" | "achievementDetail" | "practice" | "ritual";
type PracticeMode = "recite" | "copy" | "type";
type RitualStage = "offering" | "burning" | "transition" | "clear";

const scriptures: Scripture[] = builtInScriptures;

const customScriptureCover = "/assets/background-library/painted-scroll-corridor.png";
const customScriptureIntroduction = "自录之文，不拘门类。存于一隅，随时展卷，静心温习。";

function loadCustomScriptures(): Scripture[] {
  try {
    return JSON.parse(localStorage.getItem("jingge-custom-scriptures-v2") || "[]") as Scripture[];
  } catch {
    return [];
  }
}

const practiceNames: Record<PracticeMode, { title: string; caption: string }> = {
  recite: { title: "诵持", caption: "随声逐句" },
  copy: { title: "临经", caption: "落笔成章" },
  type: { title: "默录", caption: "逐字入心" },
};

const achievements = [
  { id: "first-flame", name: "初燃", image: "/assets/achievements/v4/first-flame-square.png", unlocked: true, summary: "完成第一次修习", condition: "完成任意一次诵持、临经或默录。", unlockDate: "2026年7月28日" },
  { id: "first-memory", name: "字入灵台", image: "/assets/achievements/v4/first-memory-square-transparent.png", unlocked: true, summary: "完成首次默录", condition: "完整默录任意一篇经文。", unlockDate: "2026年8月16日" },
  { id: "incense", name: "一炷香", image: "/assets/achievements/v4/incense-bracelet-square.png", unlocked: true, summary: "累计修习一小时", condition: "诵持、临经或默录累计达到一小时。", unlockDate: "2026年8月3日" },
  { id: "clear-breeze", name: "清风入怀", image: "/assets/achievements/v4/clear-breeze-gourd-square.png", unlocked: true, summary: "累计修习十小时", condition: "诵持、临经或默录累计达到十小时。", unlockDate: "2026年8月9日" },
  { id: "seven-days", name: "七日有常", image: "/assets/achievements/v4/seven-days-square-transparent.png", unlocked: false, summary: "在七个不同日期修习", condition: "不必连续，在七个不同的日期各完成一次修习。", unlockDate: "" },
  { id: "morning-light", name: "朝露初明", image: "/assets/achievements/v4/morning-light-square-transparent.png", unlocked: false, summary: "清晨完成五次诵持", condition: "在清晨时分完整诵持任意经文五次。", unlockDate: "" },
  { id: "moon", name: "月白", image: "/assets/achievements/v4/moon-jade-square.png", unlocked: false, summary: "夜间诵持十次", condition: "在夜间完整诵持任意经文十次。", unlockDate: "" },
  { id: "lotus", name: "心莲初放", image: "/assets/achievements/v4/lotus-beads-square.png", unlocked: true, summary: "完成首次临经", condition: "完成一次纸上临经，并将照片留存于本机。", unlockDate: "2026年8月12日" },
  { id: "ink-remains", name: "墨痕留真", image: "/assets/achievements/v4/ink-remains-square-transparent.png", unlocked: false, summary: "完成十次临经", condition: "累计完成十次纸上临经，并将照片留存于本机。", unlockDate: "" },
  { id: "memory-ten", name: "默契成章", image: "/assets/achievements/v4/memory-ten-square-transparent.png", unlocked: false, summary: "完成十次默录", condition: "累计完整默录任意经文十次。", unlockDate: "" },
  { id: "three-ways", name: "三法同修", image: "/assets/achievements/v4/three-ways-square-transparent.png", unlocked: false, summary: "以三种方式修习同一篇经文", condition: "对同一篇经文分别完成诵持、临经与默录。", unlockDate: "" },
  { id: "own-scroll", name: "自得一卷", image: "/assets/achievements/v4/own-scroll-square-transparent.png", unlocked: false, summary: "完成一篇自录经文", condition: "录入一篇自己的经文，并完成一次修习。", unlockDate: "" },
  { id: "five-scrolls", name: "五卷同观", image: "/assets/achievements/v4/five-scrolls-square-v3.png", unlocked: false, summary: "修习五种经文", condition: "选择五种不同经文，并各完成一次修习。", unlockDate: "" },
  { id: "scripture", name: "藏经佩", image: "/assets/achievements/v4/scripture-necklace-square.png", unlocked: false, summary: "完成临经三十篇", condition: "累计完成三十篇纸上临经。", unlockDate: "" },
  { id: "pine-stillness", name: "松声入定", image: "/assets/achievements/v4/pine-stillness-ruyi-square.png", unlocked: false, summary: "完整诵持三十次", condition: "累计完整诵持任意经文三十次。", unlockDate: "" },
  { id: "clarity", name: "念头通达", image: "/assets/achievements/v4/clarity-amber-square.png", unlocked: true, summary: "完成十八次焚经", condition: "完成十八次修持，并让经纸归于焚炉。", unlockDate: "2026年8月22日" },
  { id: "deep-water", name: "静水流深", image: "/assets/achievements/v4/deep-water-square-transparent.png", unlocked: false, summary: "累计修习三十小时", condition: "诵持、临经或默录累计达到三十小时。", unlockDate: "" },
  { id: "incense-script", name: "炉香成篆", image: "/assets/achievements/v4/incense-script-square-transparent.png", unlocked: false, summary: "焚经五十卷", condition: "完成五十次修持，并让经纸归于焚炉。", unlockDate: "" },
  { id: "hundred-clear", name: "百念澄明", image: "/assets/achievements/v4/hundred-clear-square-transparent.png", unlocked: false, summary: "焚经一百卷", condition: "完成一百次修持，并让经纸归于焚炉。", unlockDate: "" },
  { id: "cloud", name: "行至云深", image: "/assets/achievements/v4/cloud-bamboo-pin-square.png", unlocked: false, summary: "累计修习一百小时", condition: "诵持、临经或默录累计达到一百小时。", unlockDate: "" },
  { id: "clear-heart", name: "澄怀观道", image: "/assets/achievements/v4/clear-heart-jade-square.png", unlocked: false, summary: "完成一百次修习", condition: "诵持、临经或默录累计完成一百次。", unlockDate: "" },
  { id: "four-seasons", name: "四时清和", image: "/assets/achievements/v4/four-seasons-square.png", unlocked: false, summary: "累计修习三百六十五小时", condition: "诵持、临经或默录累计达到三百六十五小时。", unlockDate: "" },
  { id: "void", name: "太虚同游", image: "/assets/achievements/v4/void-whisk-square.png", unlocked: false, summary: "累计修习五百小时", condition: "诵持、临经或默录累计达到五百小时。", unlockDate: "" },
] as const;

type Achievement = (typeof achievements)[number];

function achievementDateValue(value: string) {
  const parts = value.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!parts) return 0;
  return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])).getTime();
}

const orderedAchievements = [...achievements].sort((left, right) => {
  if (left.unlocked !== right.unlocked) return Number(right.unlocked) - Number(left.unlocked);
  if (left.unlocked && right.unlocked) {
    return achievementDateValue(right.unlockDate) - achievementDateValue(left.unlockDate);
  }
  return 0;
});

function achievementDescription(item: Achievement) {
  const condition = item.condition.replace(/[。；]+$/, "");
  return item.unlockDate ? `${condition}；已于${formatChineseDate(item.unlockDate)}解锁。` : `${condition}。`;
}

function formatChineseNumber(value: number): string {
  const numerals = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (value === 0) return numerals[0];
  if (value >= 10000) {
    const high = Math.floor(value / 10000);
    const low = value % 10000;
    return `${formatChineseNumber(high)}万${low ? `${low < 1000 ? "零" : ""}${formatChineseNumber(low)}` : ""}`;
  }

  const units = ["", "十", "百", "千"];
  const digits = String(Math.floor(value)).split("").map(Number);
  let result = "";
  let pendingZero = false;
  digits.forEach((digit, index) => {
    const unitIndex = digits.length - index - 1;
    if (digit === 0) {
      pendingZero = Boolean(result) && digits.slice(index + 1).some(Boolean);
      return;
    }
    if (pendingZero) result += "零";
    result += `${numerals[digit]}${units[unitIndex]}`;
    pendingZero = false;
  });
  return result.replace(/^一十/, "十");
}

function formatChineseDate(value: string) {
  const parts = value.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!parts) return value;
  const numerals = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const year = parts[1].split("").map((digit) => numerals[Number(digit)]).join("");
  return `${year}年${formatChineseNumber(Number(parts[2]))}月${formatChineseNumber(Number(parts[3]))}日`;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours) return `${formatChineseNumber(hours)}时${minutes ? `${formatChineseNumber(minutes)}分` : ""}${rest ? `${formatChineseNumber(rest)}秒` : ""}`;
  if (minutes) return `${formatChineseNumber(minutes)}分${rest ? `${formatChineseNumber(rest)}秒` : ""}`;
  return `${formatChineseNumber(rest)}秒`;
}

function normalizeScripture(value: string) {
  return value.match(/\p{Script=Han}/gu)?.join("") || "";
}

function splitTypingLines(lines: string[]) {
  return lines.flatMap((line) => line.split(/[，。；！？：]/u).map((part) => part.trim()).filter(Boolean));
}

function countScriptureCharacters(lines: string[]) {
  return lines.join("").match(/\p{Script=Han}/gu)?.length || 0;
}

function cachePhoto(file: File) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open("jingge-local", 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("practice-photos")) {
        request.result.createObjectStore("practice-photos");
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("practice-photos", "readwrite");
      transaction.objectStore("practice-photos").put({ file, name: file.name, savedAt: Date.now() }, "latest");
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

export default function Prototype() {
  const keyboard = useKeyboard();
  const { keyboardHeight } = useKeyboardInsets();
  const shouldReduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const homeEntrancePlayed = useRef(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [customScriptures, setCustomScriptures] = useState<Scripture[]>(loadCustomScriptures);
  const allScriptures = useMemo(() => [...scriptures, ...customScriptures], [customScriptures]);
  const [scripture, setScripture] = useState(() => {
    const saved = localStorage.getItem("jingge-scripture") || "xinjing";
    return [...scriptures, ...loadCustomScriptures()].find((item) => item.id === saved) || scriptures[0];
  });
  const [librarySelectionId, setLibrarySelectionId] = useState(scripture.id);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("recite");
  const [lineIndex, setLineIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [ritualStage, setRitualStage] = useState<RitualStage>("offering");
  const [ritualHolding, setRitualHolding] = useState(false);
  const [ritualRunId, setRitualRunId] = useState(0);
  const ritualHoldTimer = useRef<number | null>(null);
  const ritualSequenceTimers = useRef<number[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement>(achievements[0]);
  const [achievementsScrolled, setAchievementsScrolled] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [completedCount, setCompletedCount] = useState(() => Number(localStorage.getItem("jingge-completed") || 18));

  const typingLines = useMemo(() => splitTypingLines(scripture.lines), [scripture]);
  const targetText = useMemo(() => typingLines.join("\n"), [typingLines]);
  const targetClean = useMemo(() => normalizeScripture(targetText), [targetText]);
  const typedClean = useMemo(() => normalizeScripture(typedText), [typedText]);
  const typingComplete = targetClean.length > 0 && typedClean.length === targetClean.length;
  const activeTypingLine = useMemo(() => {
    let consumed = 0;
    for (let index = 0; index < typingLines.length; index += 1) {
      consumed += normalizeScripture(typingLines[index]).length;
      if (typedClean.length < consumed) return index;
    }
    return Math.max(0, typingLines.length - 1);
  }, [typedClean.length, typingLines]);
  const practiceComplete = (practiceMode === "recite" && lineIndex >= scripture.lines.length)
    || (practiceMode === "copy" && Boolean(photoName))
    || (practiceMode === "type" && typingComplete);
  const librarySelection = allScriptures.find((item) => item.id === librarySelectionId) || allScriptures[0];

  useEffect(() => {
    const backgroundImage = screen === "home"
      ? scripture.cover
      : screen === "library"
        ? librarySelection.cover
        : screen === "practice"
          ? "/assets/paper/practice-paper.webp"
          : "";
    const backgroundColor = screen === "ritual"
      ? "#050402"
      : screen === "achievements" || screen === "achievementDetail"
        ? "#f7f1df"
        : screen === "practice"
          ? "#eee9e1"
          : "#f7f4e9";

    document.documentElement.style.backgroundColor = backgroundColor;
    document.body.style.backgroundColor = backgroundColor;
    document.body.style.backgroundImage = backgroundImage ? `url(${backgroundImage})` : "none";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
  }, [librarySelection.cover, screen, scripture.cover]);

  useEffect(() => {
    if (!running || screen !== "practice" || practiceMode !== "recite") return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [practiceMode, running, screen]);

  useEffect(() => {
    localStorage.setItem("jingge-completed", String(completedCount));
  }, [completedCount]);

  useEffect(() => {
    localStorage.setItem("jingge-scripture", scripture.id);
  }, [scripture]);

  useEffect(() => {
    if (!typingComplete || practiceMode !== "type") return;
    keyboard.hide();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }, [keyboard, practiceMode, typingComplete]);

  useEffect(() => {
    if (screen !== "practice" || practiceMode !== "type" || !keyboard.visible || typingComplete) return;

    const frame = window.requestAnimationFrame(() => {
      const scroller = rootRef.current?.querySelector<HTMLElement>(".typing-scroll .mobile-scroll");
      if (!scroller) return;

      const lineHeight = 36;
      const activeLineCenter = 137 + activeTypingLine * lineHeight + lineHeight / 2;
      const desiredTop = activeLineCenter - scroller.clientHeight * 0.46;
      const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      scroller.scrollTo({
        top: Math.min(maxTop, Math.max(0, desiredTop)),
        behavior: shouldReduceMotion ? "auto" : "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeTypingLine, keyboard.visible, practiceMode, screen, shouldReduceMotion, typingComplete]);

  useEffect(() => {
    const frame = rootRef.current?.closest(".device-screen");
    const resetFrameScroll = window.requestAnimationFrame(() => {
      if (frame instanceof HTMLElement) frame.scrollTop = 0;
    });
    return () => window.cancelAnimationFrame(resetFrameScroll);
  }, [screen]);

  useEffect(() => {
    setAchievementsScrolled(false);
    if (screen !== "achievements") return;

    let scroller: HTMLElement | null = null;
    const handleScroll = () => setAchievementsScrolled((scroller?.scrollTop || 0) > 18);
    const frame = window.requestAnimationFrame(() => {
      scroller = rootRef.current?.querySelector(".achievements-scroll") as HTMLElement | null;
      scroller?.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      scroller?.removeEventListener("scroll", handleScroll);
    };
  }, [screen]);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  useEffect(() => () => {
    if (ritualHoldTimer.current) window.clearTimeout(ritualHoldTimer.current);
    ritualSequenceTimers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const goHome = () => {
    keyboard.hide();
    setRunning(false);
    setScreen("home");
  };

  const startPractice = (mode: PracticeMode) => {
    keyboard.hide();
    setPracticeMode(mode);
    setLineIndex(0);
    setSeconds(0);
    setTypedText("");
    setPhotoName("");
    setPhotoPreview("");
    setPhotoError("");
    setRunning(mode === "recite");
    setScreen("practice");
  };

  const beginRitual = () => {
    keyboard.hide();
    setRunning(false);
    setRitualHolding(false);
    setRitualRunId((value) => value + 1);
    setRitualStage("offering");
    setScreen("ritual");
  };

  const finishBurning = () => {
    ritualSequenceTimers.current.forEach((timer) => window.clearTimeout(timer));
    setRitualStage("transition");
    ritualSequenceTimers.current = [window.setTimeout(() => {
      setCompletedCount((count) => count + 1);
      setRitualStage("clear");
    }, shouldReduceMotion ? 100 : 1800)];
  };

  const completeOffering = () => {
    if (ritualStage !== "offering") return;
    if (ritualHoldTimer.current) window.clearTimeout(ritualHoldTimer.current);
    ritualHoldTimer.current = null;
    setRitualHolding(false);
    if ("vibrate" in navigator) navigator.vibrate(12);
    setRitualStage("burning");
    ritualSequenceTimers.current.forEach((timer) => window.clearTimeout(timer));
    ritualSequenceTimers.current = [
      window.setTimeout(finishBurning, shouldReduceMotion ? 90 : 5800),
    ];
  };

  const startOfferingHold = () => {
    if (ritualStage !== "offering" || ritualHolding) return;
    setRitualHolding(true);
    ritualHoldTimer.current = window.setTimeout(completeOffering, shouldReduceMotion ? 80 : 1150);
  };

  const cancelOfferingHold = () => {
    if (ritualStage !== "offering") return;
    if (ritualHoldTimer.current) window.clearTimeout(ritualHoldTimer.current);
    ritualHoldTimer.current = null;
    setRitualHolding(false);
  };

  const handlePhoto = async (file?: File) => {
    if (!file) return;
    setPhotoError("");
    try {
      await cachePhoto(file);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(URL.createObjectURL(file));
      setPhotoName(file.name || "本次临经照片");
    } catch {
      setPhotoError("照片暂时无法缓存，请重新选择。");
    }
  };

  const handleTyping = (value: string) => {
    const characters = normalizeScripture(value).slice(0, targetClean.length);
    const formatted: string[] = [];
    let offset = 0;

    for (const line of typingLines) {
      const lineLength = normalizeScripture(line).length;
      const chunk = characters.slice(offset, offset + lineLength);
      if (!chunk) break;
      formatted.push(chunk);
      offset += lineLength;
      if (chunk.length < lineLength) break;
    }

    setTypedText(formatted.join("\n"));
  };

  const chooseScripture = (item: Scripture) => {
    setScripture(item);
    setScreen("home");
  };

  const openLibrary = () => {
    setLibrarySelectionId(scripture.id);
    setScreen("library");
  };

  const openCreatePanel = () => {
    keyboard.hide();
    setCreateOpen(true);
  };

  const closeCreatePanel = () => {
    keyboard.hide();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setCreateOpen(false);
  };

  const saveCustomScripture = () => {
    const content = draft.trim();
    if (!content) return;
    const index = customScriptures.length + 1;
    const item: Scripture = {
      id: `custom-${Date.now()}`,
      title: `自录经文 · ${index}`,
      subtitle: "一字一念，自在心间。",
      excerpt: content.slice(0, 38),
      introduction: customScriptureIntroduction,
      cover: customScriptureCover,
      lines: content.split(/\n+|(?<=[。！？；])/).map((line) => line.trim()).filter(Boolean),
      isCustom: true,
    };
    const next = [...customScriptures, item];
    setCustomScriptures(next);
    localStorage.setItem("jingge-custom-scriptures-v2", JSON.stringify(next));
    setLibrarySelectionId(item.id);
    setDraft("");
    closeCreatePanel();
  };

  return (
    <div ref={rootRef} className="jingge-root">
      <AnimatePresence mode="sync">
        {screen === "home" && (
          <motion.div key="home" className="screen-layer" initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MobileScroll className="app-screen home-screen" >
              <main className="home-content" aria-label="经阁首页">
                <motion.div
                  className="home-backdrop"
                  style={{ backgroundImage: `url(${scripture.cover})` }}
                  initial={homeEntrancePlayed.current || shouldReduceMotion ? false : { opacity: .68, scale: 1.012 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: shouldReduceMotion ? .01 : 1.05, ease: [.22, 1, .36, 1] }}
                  onAnimationComplete={() => { homeEntrancePlayed.current = true; }}
                />
                <motion.nav
                  className="home-nav"
                  aria-label="首页导航"
                  initial={homeEntrancePlayed.current || shouldReduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: .55, delay: .08 }}
                >
                  <button className="wordmark" onClick={openLibrary} aria-label="打开经阁">经阁</button>
                  <button className="merit-link" onClick={() => setScreen("achievements")}>功果</button>
                </motion.nav>

                <motion.section
                  className="hero-copy"
                  initial={homeEntrancePlayed.current || shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: .72, delay: .16, ease: [.22, 1, .36, 1] }}
                >
                  <h1>{scripture.title}</h1>
                  <p className="sutra-subtitle">{scripture.subtitle}</p>
                </motion.section>

                <motion.section
                  className="mode-entry"
                  aria-label="选择修习方式"
                  initial={homeEntrancePlayed.current || shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: .68, delay: .28, ease: [.22, 1, .36, 1] }}
                >
                  {(Object.keys(practiceNames) as PracticeMode[]).map((mode) => (
                    <button key={mode} onClick={() => startPractice(mode)} aria-label={`${practiceNames[mode].title}：${practiceNames[mode].caption}`}>
                      <strong>{practiceNames[mode].title}</strong>
                    </button>
                  ))}
                </motion.section>

              </main>
            </MobileScroll>
          </motion.div>
        )}

        {screen === "library" && (
          <motion.div key="library" className="screen-layer library-screen" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }}>
            <motion.div
              className="library-backdrop"
              key={librarySelection.id}
              style={{ backgroundImage: `url(${librarySelection.cover})` }}
              initial={{ opacity: 0, scale: 1.018 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: shouldReduceMotion ? .01 : .65, ease: [.22, 1, .36, 1] }}
            />
            <header className="library-header">
              <button onClick={goHome} aria-label="返回首页">回首</button>
              <button onClick={openCreatePanel} aria-label="录入新经">录经</button>
            </header>
            <main className="library-gallery">
              <motion.section className="library-copy" key={`copy-${librarySelection.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <h1>{librarySelection.title}</h1>
                <p>全文 {countScriptureCharacters(librarySelection.lines)} 字。{librarySelection.introduction}</p>
                <button onClick={() => chooseScripture(librarySelection)}>
                  {librarySelection.id === scripture.id ? "已为常卷" : "奉为常卷"}
                </button>
              </motion.section>
              <Carousel className="scripture-carousel" contentClassName="scripture-carousel-track" ariaLabel="经文卷册">
                {allScriptures.map((item) => (
                  <button
                    key={item.id}
                    role="listitem"
                    className={item.id === librarySelection.id ? "selected" : ""}
                    onClick={() => setLibrarySelectionId(item.id)}
                    aria-label={`预览${item.title}`}
                    aria-pressed={item.id === librarySelection.id}
                  >
                    <img src={item.cover} alt="" draggable={false} />
                    <span>{item.title}</span>
                  </button>
                ))}
                <button className="carousel-create" onClick={openCreatePanel} aria-label="录入新经">
                  <span>录经</span>
                </button>
              </Carousel>
            </main>
          </motion.div>
        )}

        {screen === "achievements" && (
          <motion.div key="achievements" className="screen-layer achievements-screen" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <header className={`achievements-floating-header${achievementsScrolled ? " is-scrolled" : ""}`}>
              <button onClick={goHome} aria-label="返回首页">回首</button>
            </header>
            <MobileScroll className="page-scroll achievements-scroll">
              <main className="achievements-content">
                <section className="merit-summary"><strong>{formatChineseNumber(27)}小时</strong><span>经纸归炉{formatChineseNumber(completedCount)}卷</span></section>
                <div className="achievement-grid" aria-label="功果列表">
                  {orderedAchievements.map((item) => (
                    <button key={item.id} className={item.unlocked ? "achievement-item unlocked" : "achievement-item locked"} onClick={() => { setSelectedAchievement(item); setScreen("achievementDetail"); }}>
                      <motion.span className="achievement-art" layoutId={`achievement-art-${item.id}`} transition={{ duration: shouldReduceMotion ? .01 : .48, ease: [.22, 1, .36, 1] }}>
                        <img src={item.image} alt="" draggable={false} />
                      </motion.span>
                      <strong>{item.name}</strong>
                      <small>{item.summary}</small>
                    </button>
                  ))}
                </div>
              </main>
            </MobileScroll>
          </motion.div>
        )}

        {screen === "achievementDetail" && (
          <motion.div key={`achievement-${selectedAchievement.id}`} className="screen-layer achievement-detail-screen" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }}>
            <header className="achievement-detail-floating-header">
              <button onClick={() => setScreen("achievements")} aria-label="返回功果列表">回首</button>
            </header>
            <MobileScroll className="page-scroll achievement-detail-scroll">
              <main className={`achievement-detail-content ${selectedAchievement.unlocked ? "unlocked" : "locked"}`}>
                <motion.div className="achievement-detail-art" layoutId={`achievement-art-${selectedAchievement.id}`} transition={{ duration: shouldReduceMotion ? .01 : .48, ease: [.22, 1, .36, 1] }}>
                  <img src={selectedAchievement.image} alt={selectedAchievement.name} draggable={false} />
                </motion.div>
                <motion.section className="achievement-detail-copy" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .42, delay: .16, ease: [.22, 1, .36, 1] }}>
                  <h1>{selectedAchievement.name}</h1>
                  <p>{achievementDescription(selectedAchievement)}</p>
                </motion.section>
              </main>
            </MobileScroll>
          </motion.div>
        )}

        {screen === "practice" && (
          <motion.div key={`practice-${practiceMode}`} className={`screen-layer practice-screen mode-${practiceMode}${practiceComplete ? " is-complete" : ""}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <header className="practice-header">
              <button onClick={goHome} aria-label="返回首页">回首</button>
              <div><strong>{scripture.title}</strong></div>
              <span>{practiceMode === "recite" ? formatDuration(seconds) : ""}</span>
            </header>

            {practiceMode === "recite" && (
              <main className="recite-stage" onClick={() => setLineIndex((index) => Math.min(scripture.lines.length, index + 1))} aria-label="轻触点亮下一句">
                <motion.div className="recite-rail" animate={{ y: 318 - lineIndex * 92 }} transition={{ duration: shouldReduceMotion ? .01 : .42, ease: [.22, 1, .36, 1] }}>
                  {scripture.lines.map((line, index) => (
                    <p key={line} className={index === lineIndex ? "current" : index < lineIndex ? "past" : "future"}>{line}</p>
                  ))}
                </motion.div>
              </main>
            )}

            {practiceMode === "copy" && (
              <MobileScroll className="practice-body-scroll copy-scroll">
                <main className="full-scripture">
                  {scripture.lines.map((line) => <p key={line}>{line}</p>)}
                  {photoPreview && <img className="photo-preview" src={photoPreview} alt="已缓存的临经照片" draggable={false} />}
                </main>
              </MobileScroll>
            )}

            {practiceMode === "type" && (
              <MobileScroll className="practice-body-scroll typing-scroll">
                <main className="typing-content">
                  <div className="type-sheet">
                    <div className="ghost-scripture" aria-hidden="true">{targetText}</div>
                    <KeyboardTextarea
                      className="typing-input"
                      value={typedText}
                      onChange={(event) => {
                        if ((event.nativeEvent as InputEvent).isComposing) {
                          setTypedText(event.target.value);
                          return;
                        }
                        handleTyping(event.target.value);
                      }}
                      onCompositionEnd={(event) => handleTyping(event.currentTarget.value)}
                      onBlur={() => keyboard.hide()}
                      spellCheck={false}
                      aria-label="默录经文"
                    />
                  </div>
                </main>
              </MobileScroll>
            )}

            {(practiceMode === "copy" || practiceComplete) && <footer className="practice-footer">
              {practiceMode === "copy" && !photoName && (
                <button className="text-action" onClick={() => photoInputRef.current?.click()}>留影</button>
              )}
              {practiceMode === "copy" && photoName && <p className="saved-photo"><CheckIcon /> 已缓存 · {photoName}</p>}
              {practiceMode === "copy" && photoError && <p className="photo-error">{photoError}</p>}
              {practiceComplete && <button className="burn-action" onClick={beginRitual}>焚经</button>}
              {practiceMode === "copy" && (
                <input
                  ref={photoInputRef}
                  className="photo-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  aria-hidden="true"
                  tabIndex={-1}
                  onChange={(event) => handlePhoto(event.target.files?.[0])}
                />
              )}
            </footer>}
          </motion.div>
        )}

        {screen === "ritual" && (
          <motion.div
            key="ritual"
            className={`screen-layer ritual-screen stage-${ritualStage}${ritualHolding ? " is-holding" : ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {(ritualStage === "offering" || ritualStage === "burning" || ritualStage === "transition") && (
              <motion.div
                className="burning-artwork"
                initial={false}
                animate={ritualStage === "burning" || ritualStage === "transition"
                  ? { scale: 1, filter: "brightness(1) saturate(1)" }
                  : { scale: ritualHolding ? 1.018 : 1, filter: "brightness(.86) saturate(.88)" }}
                transition={{ duration: ritualStage === "burning" ? .3 : .45, ease: [.22, 1, .36, 1] }}
                aria-hidden="true"
              >
                {ritualStage === "offering" ? (
                  <img src="/assets/ritual/scripture-offering.jpg" alt="" draggable={false} />
                ) : (
                  <video
                    key={ritualRunId}
                    src="/assets/ritual/scripture-burning.mp4"
                    poster="/assets/ritual/scripture-offering.jpg"
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    onEnded={() => {
                      if (ritualStage === "burning") finishBurning();
                    }}
                  />
                )}
              </motion.div>
            )}

            {ritualStage === "offering" && (
              <button
                className="ritual-offer-action"
                onPointerDown={startOfferingHold}
                onPointerUp={cancelOfferingHold}
                onPointerCancel={cancelOfferingHold}
                onPointerLeave={cancelOfferingHold}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    completeOffering();
                  }
                }}
                aria-label="按住奉经"
              >
                <span>按住奉经</span><i aria-hidden="true" />
              </button>
            )}

            {ritualStage === "transition" && (
              <motion.div className="black-transition" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: shouldReduceMotion ? .01 : 1.8, ease: [.37, 0, .63, 1] }} aria-hidden="true" />
            )}

            {ritualStage === "clear" && (
              <motion.button className="clear-result" onClick={goHome} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .7 }}>
                <motion.strong initial={{ opacity: 0, y: 9, letterSpacing: ".34em" }} animate={{ opacity: 1, y: 0, letterSpacing: ".21em" }} transition={{ duration: .95, delay: .16, ease: [.22, 1, .36, 1] }}>念头通达</motion.strong>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {createOpen && (
          <motion.div
            className="create-dialog-overlay"
            style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 22 : 54 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? .01 : .22 }}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) closeCreatePanel();
            }}
          >
            <motion.section
              className="create-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-dialog-title"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10, scale: .985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 7, scale: .99 }}
              transition={{ duration: shouldReduceMotion ? .01 : .36, ease: [.22, 1, .36, 1] }}
            >
              <header className="create-dialog-header">
                <h2 id="create-dialog-title">录入新经</h2>
                <button type="button" onClick={closeCreatePanel}>暂缓</button>
              </header>
              <KeyboardTextarea
                className="create-scripture-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={() => keyboard.hide()}
                placeholder="于此粘贴经文……"
                aria-label="经文内容"
              />
              <footer className="create-dialog-actions">
                <button className="upload-action" type="button">识图取文</button>
                <button className="save-action" type="button" onClick={saveCustomScripture} disabled={!draft.trim()}>收入经阁</button>
              </footer>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
