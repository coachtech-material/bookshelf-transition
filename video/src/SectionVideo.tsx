import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CaptionOverlay } from "./CaptionOverlay";
import { theme } from "./theme";
import type { Scene, SectionVideoProps } from "./types";
import { CodeCompareScene } from "./scenes/CodeCompareScene";
import { FigureScene } from "./scenes/FigureScene";
import { FlowScene } from "./scenes/FlowScene";
import { KeypointScene } from "./scenes/KeypointScene";
import { NestScene } from "./scenes/NestScene";
import { OutroScene } from "./scenes/OutroScene";
import { TitleScene } from "./scenes/TitleScene";

export const TRANSITION_FRAMES = 14;
export const DEFAULT_SCENE_FRAMES = 240;

const SceneContent = ({
  scene,
  sectionLabel,
}: {
  scene: Scene;
  sectionLabel: string;
}) => {
  switch (scene.type) {
    case "title":
      return <TitleScene scene={scene} sectionLabel={sectionLabel} />;
    case "codeCompare":
      return <CodeCompareScene scene={scene} />;
    case "keypoint":
      return <KeypointScene scene={scene} />;
    case "figure":
      return <FigureScene scene={scene} />;
    case "flow":
      return <FlowScene scene={scene} />;
    case "nest":
      return <NestScene scene={scene} />;
    case "outro":
      return <OutroScene scene={scene} />;
    default:
      return null;
  }
};

/**
 * 背景の奥行きレイヤー（マット・つや消し）。
 * 大きな発光オーブは使わず、紙の微粒子テクスチャ + 角のごく淡い色味で
 * 「マットで立体感のある下地」を作る。
 */
const Backdrop = () => {
  const frame = useCurrentFrame();
  // 角に置く淡い色味（発光ではなく「色のニュアンス」。ごくゆっくり漂う）
  const wash = (
    color: string,
    size: number,
    cx: number,
    cy: number,
    k: number,
  ) => (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
        left: cx + Math.sin(frame / (260 * k)) * 26,
        top: cy + Math.cos(frame / (320 * k)) * 20,
      }}
    />
  );
  return (
    <AbsoluteFill>
      {wash("rgba(59,130,246,0.06)", 1100, 1080, -360, 1)}
      {wash("rgba(249,115,22,0.055)", 980, -320, 600, 1.3)}
      {/* 紙の微粒子（中立グレーの細かいドット）。マットな質感の核 */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${theme.grain} 1px, transparent 1px)`,
          backgroundSize: "26px 26px",
        }}
      />
    </AbsoluteFill>
  );
};

const ProgressBar = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        height: 5,
        width: (frame / durationInFrames) * width,
        background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`,
        opacity: 0.9,
      }}
    />
  );
};

/** 最終フレームで背景色へ落とす締めのフェード */
const EndFade = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames - 1],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill style={{ background: theme.bg2, opacity, pointerEvents: "none" }} />
  );
};

const SectionChip = ({ label }: { label: string }) => (
  <div
    style={{
      position: "absolute",
      top: 44,
      right: 56,
      fontSize: 24,
      color: theme.dim,
      opacity: 0.85,
      fontFamily: theme.fontJa,
    }}
  >
    {label}
  </div>
);

export const SectionVideo = ({
  sectionId,
  sectionLabel,
  title,
  scenes,
}: SectionVideoProps) => {
  const items = scenes.flatMap((scene, i) => {
    const sequence = (
      <TransitionSeries.Sequence
        key={scene.id}
        durationInFrames={scene.totalFrames ?? DEFAULT_SCENE_FRAMES}
      >
        <SceneContent scene={scene} sectionLabel={sectionLabel} />
        {scene.type !== "title" ? (
          <SectionChip label={`${sectionId} ${title}`} />
        ) : null}
        <CaptionOverlay
          narration={scene.narration}
          audioFrames={scene.audioFrames ?? scene.totalFrames ?? DEFAULT_SCENE_FRAMES}
        />
        {scene.audioSrc ? <Audio src={staticFile(scene.audioSrc)} /> : null}
      </TransitionSeries.Sequence>
    );
    if (i === scenes.length - 1) {
      return [sequence];
    }
    return [
      sequence,
      <TransitionSeries.Transition
        key={`transition-${scene.id}`}
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />,
    ];
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1500px 1000px at 50% 30%, ${theme.bg2} 0%, ${theme.bg1} 75%)`,
        fontFamily: theme.fontJa,
      }}
    >
      <Backdrop />
      <TransitionSeries>{items}</TransitionSeries>
      <ProgressBar />
      <EndFade />
    </AbsoluteFill>
  );
};
