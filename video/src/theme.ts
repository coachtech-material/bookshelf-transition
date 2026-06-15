/**
 * 動画のデザイントークン。
 *
 * 方針: GitHub Pages サイト（モノクロ白黒）に合わせた「ライト・マット基調」。
 * 白〜オフホワイトのマットな面を基調に、青（#3B82F6）とオレンジ（#F97316）を
 * アクセントとして使う（/illustrate の概念図と同じ配色）。質感は
 * 「立体感・リッチ・マット・大人」を狙い、紙のような多層影と上端ハイライトで
 * 奥行きを出す（つや消し。大きなグラデーション発光は使わない）。
 *
 * すべてのシーンはこのトークンを参照する。将来ダーク基調へ振る場合も、
 * 値を差し替えるだけで全シーンへ波及する（セマンティック設計）。
 */

// アクセントの基準色（illustrate と統一: 青 #3B82F6 / オレンジ #F97316）
const BLUE = "#3B82F6";
const BLUE_DEEP = "#2563EB"; // ライト面に「文字」として乗せるときの濃色
const ORANGE = "#F97316";
const ORANGE_DEEP = "#E2670C"; // ライト面に「文字」として乗せるときの濃色
const INK = "#141822"; // 濃紺インク（コード面・字幕バーの暗色）

export const theme = {
  // 背景（マットなオフホワイト。SectionVideo 側で中心→外周のごく浅いビネット）
  bg1: "#E8E7E2", // 外周（やや沈める）
  bg2: "#F6F5F1", // 中心（紙のような温かいオフホワイト）
  grain: "rgba(20,22,28,0.045)", // 紙の微粒子テクスチャ（ドット）

  // 面（持ち上がった紙）
  panel: "#FCFCFA",
  panelAlt: "#FFFFFF",
  panelBorder: "#E4E2DB",
  hairline: "rgba(20,22,28,0.07)",
  topHighlight: "inset 0 1px 0 rgba(255,255,255,0.92)", // 面の上端ハイライト（立体感）

  // 影（紙のようなマットな多層影。色は中立グレー）
  shadowSoft: "0 2px 6px rgba(22,24,30,0.05)",
  shadow: "0 14px 34px rgba(22,24,30,0.10), 0 3px 9px rgba(22,24,30,0.06)",
  shadowLift: "0 30px 66px rgba(22,24,30,0.16), 0 8px 18px rgba(22,24,30,0.08)",

  // コード面・字幕バー（唯一の暗色要素＝濃紺インク）
  codeBg: INK,
  codeBorder: "#293142",
  codeText: "#EEF1F6",
  codeComment: "rgba(150,162,184,0.72)",
  captionBg: "rgba(19,23,33,0.95)",

  // テキスト
  text: "#16181F",
  dim: "#5C616C",
  faint: "#9A9EA8",

  // アクセント（primary=青 / accent=オレンジ。illustrate と統一）
  primary: BLUE,
  primaryDeep: BLUE_DEEP,
  primarySoft: "rgba(59,130,246,0.10)",
  accent: ORANGE,
  accentDeep: ORANGE_DEEP,
  accentSoft: "rgba(249,115,22,0.12)",

  // エラー（ライト面用／ダークなコード面内用）
  error: "#D6452F",
  errorOnDark: "#FF8A7A",

  fontJa: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif",
  fontMono: "'SF Mono',Menlo,Consolas,'Courier New',monospace",
};
