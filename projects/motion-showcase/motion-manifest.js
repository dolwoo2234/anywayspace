/**
 * Anyway Space - 60s Cinematic Showcase
 * Powered by Huashu-Design Motion Engine
 */

const motionConfig = {
    duration: 60, // seconds
    fps: 60,
    resolution: { width: 1920, height: 1080 },
    theme: {
        accent: "oklch(85% 0.18 110)",
        background: "oklch(15% 0.01 250)"
    },
    scenes: [
        {
            time: [0, 5],
            type: "title",
            content: "Anyway Space",
            subtitle: "High-Res Design Ecosystem",
            animation: "fade-in-blur"
        },
        {
            time: [5, 25],
            type: "mockup-showcase",
            device: "iPhone 15 Pro",
            projects: ["Mobile Viewer", "Video Prompt", "Image Resizer"],
            animation: "device-float-rotate"
        },
        {
            time: [25, 45],
            type: "ui-explode",
            elements: ["Sidebar", "Glass Panel", "OKLCH Palette"],
            animation: "parallax-scroll"
        },
        {
            time: [45, 60],
            type: "outro",
            content: "Designed with Huashu-Design",
            animation: "zoom-out-fade"
        }
    ],
    audio: {
        bgm: "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
        effects: true
    }
};

export default motionConfig;
