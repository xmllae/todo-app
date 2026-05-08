import React, { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PartyPopper, Plus, SlidersHorizontal } from "lucide-react";

const copyMap = {
  filtered: {
    title: "没有匹配的任务",
    desc: "试试收窄关键词、重置筛选，或回到全部任务。",
    action: "重置筛选"
  },
  complete: {
    title: "今天任务已全部完成",
    desc: "状态很好。可以休息一下，也可以轻轻补一条新任务。",
    action: "添加任务"
  }
};

function PremiumEmptyGlyph() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      initial={reduceMotion ? false : { opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="grid h-11 w-11 place-items-center text-zinc-400"
    >
      <PartyPopper size={34} strokeWidth={1.35} />
    </motion.div>
  );
}

export function PremiumEmptyState({ state = "filtered", onPrimary }) {
  const [pressed, setPressed] = useState(false);
  const reduceMotion = useReducedMotion();
  const content = copyMap[state] || copyMap.filtered;
  const helper = useMemo(
    () => (state === "filtered" ? "保留上下文，不打断当前工作流。" : "完成感要轻，不需要强烈庆祝。"),
    [state]
  );

  return (
    <section className="grid min-h-[320px] place-items-center px-5 py-16 text-center">
      <motion.div
        layout
        className="relative mx-auto flex max-w-sm flex-col items-center"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <PremiumEmptyGlyph />

        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={reduceMotion ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mt-3"
          >
            <h2 className="text-[17px] font-semibold leading-7 tracking-normal text-zinc-900">
              {content.title}
            </h2>
            <p className="mx-auto mt-1 max-w-[18rem] text-sm leading-6 tracking-normal text-zinc-500">
              {content.desc}
            </p>
          </motion.div>
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={onPrimary}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          whileHover={reduceMotion ? undefined : { y: -1 }}
          whileTap={reduceMotion ? undefined : { scale: 0.985 }}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white/82 px-4 text-sm font-medium tracking-normal text-zinc-700 shadow-[0_10px_30px_-24px_rgba(24,24,27,0.65)] backdrop-blur-xl transition-colors hover:border-zinc-300 hover:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-200/70"
        >
          {state === "filtered" ? <SlidersHorizontal size={15} /> : <Plus size={15} />}
          {content.action}
        </motion.button>

        <motion.p
          animate={{ opacity: pressed ? 0.9 : 0.68 }}
          className="mt-3 text-xs leading-5 tracking-normal text-zinc-400"
        >
          {helper}
        </motion.p>
      </motion.div>
    </section>
  );
}

export default function App() {
  const [state, setState] = useState("filtered");

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#fafafa)] text-zinc-900">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-10">
        <div className="mb-6 inline-flex w-fit rounded-full border border-zinc-200 bg-white/76 p-1 shadow-sm backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setState("filtered")}
            className={`rounded-full px-4 py-2 text-sm transition ${state === "filtered" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
          >
            筛选为空
          </button>
          <button
            type="button"
            onClick={() => setState("complete")}
            className={`rounded-full px-4 py-2 text-sm transition ${state === "complete" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
          >
            全部完成
          </button>
        </div>
        <div className="flex flex-1 items-center rounded-[28px] border border-zinc-200/80 bg-white/58 shadow-[0_24px_80px_-64px_rgba(24,24,27,0.58)] backdrop-blur-2xl">
          <PremiumEmptyState
            state={state}
            onPrimary={() => setState(state === "filtered" ? "complete" : "filtered")}
          />
        </div>
      </div>
    </main>
  );
}
