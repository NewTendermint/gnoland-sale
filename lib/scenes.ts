import type { SceneVideoProps } from "../app/(ui)/SceneVideo"

export const sceneVideos = {
  hero: {
    sources: [
      { src: "/sprites/vault-spin-2s.av1.mp4?v=4", type: "video/mp4; codecs=av01.0.08M.08" },
      { src: "/sprites/vault-spin-2s.webm?v=4", type: "video/webm; codecs=vp9" },
      { src: "/sprites/vault-spin-2s.mp4?v=4", type: "video/mp4; codecs=avc1.640020" },
    ],
    poster: "/sprites/vault-spin-2s.poster.jpg?v=4",
    innerDelayMs: 1100,
  },
  narrativeA: {
    sources: [
      { src: "/sprites/village-spin-2s.av1.mp4?v=4", type: "video/mp4; codecs=av01.0.08M.08" },
      { src: "/sprites/village-spin-2s.webm?v=4", type: "video/webm; codecs=vp9" },
      { src: "/sprites/village-spin-2s.mp4?v=4", type: "video/mp4; codecs=avc1.640020" },
    ],
    poster: "/sprites/village-spin-2s.poster.jpg?v=4",
  },
  narrativeB: {
    sources: [
      { src: "/sprites/village-macro-2s.av1.mp4?v=5", type: "video/mp4; codecs=av01.0.08M.08" },
      { src: "/sprites/village-macro-2s.webm?v=5", type: "video/webm; codecs=vp9" },
      { src: "/sprites/village-macro-2s.mp4?v=5", type: "video/mp4; codecs=avc1.640020" },
    ],
    poster: "/sprites/village-macro-2s.poster.jpg?v=5",
  },
  features: {
    sources: [
      { src: "/sprites/mine-spin-2s.av1.mp4?v=4", type: "video/mp4; codecs=av01.0.08M.08" },
      { src: "/sprites/mine-spin-2s.webm?v=4", type: "video/webm; codecs=vp9" },
      { src: "/sprites/mine-spin-2s.mp4?v=4", type: "video/mp4; codecs=avc1.640020" },
    ],
    poster: "/sprites/mine-spin-2s.poster.jpg?v=4",
  },
  gnotUtility: {
    sources: [
      { src: "/sprites/bridge-spin-2s.av1.mp4?v=5", type: "video/mp4; codecs=av01.0.08M.08" },
      { src: "/sprites/bridge-spin-2s.webm?v=5", type: "video/webm; codecs=vp9" },
      { src: "/sprites/bridge-spin-2s.mp4?v=5", type: "video/mp4; codecs=avc1.640020" },
    ],
    poster: "/sprites/bridge-spin-2s.poster.jpg?v=5",
  },
  partnersA: {
    sources: [
      { src: "/sprites/tree-spin-cubic.av1.mp4?v=1", type: "video/mp4; codecs=av01.0.08M.08" },
      { src: "/sprites/tree-spin-cubic.webm?v=1", type: "video/webm; codecs=vp9" },
      { src: "/sprites/tree-spin-cubic.mp4?v=1", type: "video/mp4; codecs=avc1.640020" },
    ],
    poster: "/sprites/tree-spin-cubic.poster.jpg?v=1",
  },
  partnersB: {
    sources: [
      { src: "/sprites/tree-macro-cubic.av1.mp4?v=1", type: "video/mp4; codecs=av01.0.08M.08" },
      { src: "/sprites/tree-macro-cubic.webm?v=1", type: "video/webm; codecs=vp9" },
      { src: "/sprites/tree-macro-cubic.mp4?v=1", type: "video/mp4; codecs=avc1.640020" },
    ],
    poster: "/sprites/tree-macro-cubic.poster.jpg?v=1",
  },
} satisfies Record<string, SceneVideoProps>
