import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Component Loader",
  description: "A component loading system for reducing bottlenecks in the browser",
  base: "/component-loader/",

  themeConfig: {
    nav: [
      { text: "Guide", link: "/component" },
      { text: "API", link: "/api-reference" },
    ],

    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Introduction", link: "/" },
          { text: "Component", link: "/component" },
          { text: "ComponentLoader", link: "/component-loader" },
        ],
      },
      {
        text: "Features",
        items: [
          { text: "Loading Priorities", link: "/loading-priorities" },
          { text: "Pub/Sub", link: "/pubsub" },
        ],
      },
      {
        text: "Reference",
        items: [{ text: "API Reference", link: "/api-reference" }],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/elliottregan/component-loader" },
    ],

    footer: {
      message: "Released under the ISC License.",
    },
  },
});
