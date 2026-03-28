// import type { GenerateRequest, TipTapDoc } from "./types.js";

// function textNode(text: string) {
//   return { type: "text", text };
// }

// export function buildFallbackDoc(input: GenerateRequest): TipTapDoc {
//   if (input.contentType === "social") {
//     return {
//       type: "doc",
//       content: [
//         {
//           type: "heading",
//           attrs: { level: 2 },
//           content: [textNode("Shipping faster is a design decision, not luck.")],
//         },
//         {
//           type: "paragraph",
//           content: [textNode(`Prompt: ${input.prompt}`)],
//         },
//         {
//           type: "bulletList",
//           content: [
//             { type: "listItem", content: [{ type: "paragraph", content: [textNode("Break big work into visible milestones.")] }] },
//             { type: "listItem", content: [{ type: "paragraph", content: [textNode("Reduce waiting by streaming useful partial output.")] }] },
//             { type: "listItem", content: [{ type: "paragraph", content: [textNode("Keep editing while generation continues.")] }] },
//           ],
//         },
//         {
//           type: "blockquote",
//           content: [{ type: "paragraph", content: [textNode("What users feel is speed, not your internal architecture.")] }],
//         },
//         {
//           type: "paragraph",
//           content: [textNode("What would you ship this week to cut user waiting in half?")],
//         },
//       ],
//     };
//   }

//   return {
//     type: "doc",
//     content: [
//       {
//         type: "heading",
//         attrs: { level: 1 },
//         content: [textNode("Progressive Content Rendering for AI Editors")],
//       },
//       {
//         type: "paragraph",
//         content: [textNode("Large structured outputs should appear progressively so users can read and refine in real time.")],
//       },
//       {
//         type: "heading",
//         attrs: { level: 2 },
//         content: [textNode("Why this matters")],
//       },
//       {
//         type: "paragraph",
//         content: [textNode("Blocking until full JSON is generated creates a poor user experience and increases abandonment.")],
//       },
//       {
//         type: "table",
//         content: [
//           {
//             type: "tableRow",
//             content: [
//               { type: "tableHeader", content: [{ type: "paragraph", content: [textNode("Current state")] }] },
//               { type: "tableHeader", content: [{ type: "paragraph", content: [textNode("Improved state")] }] },
//             ],
//           },
//           {
//             type: "tableRow",
//             content: [
//               { type: "tableCell", content: [{ type: "paragraph", content: [textNode("Single loading spinner")] }] },
//               { type: "tableCell", content: [{ type: "paragraph", content: [textNode("Chunked, visible sections")] }] },
//             ],
//           },
//         ],
//       },
//       {
//         type: "image",
//         attrs: { src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80", alt: "Team collaborating" },
//       },
//       {
//         type: "heading",
//         attrs: { level: 2 },
//         content: [textNode("Conclusion")],
//       },
//       {
//         type: "paragraph",
//         content: [textNode("Start with block-level streaming and evolve toward token-level structured synthesis.")],
//       },
//     ],
//   };
// }
