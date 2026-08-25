import {
  BasicBlocksPlugin,
  BasicMarksPlugin,
} from "@platejs/basic-nodes/react";
import { ListPlugin } from "@platejs/list/react";
import { MarkdownPlugin } from "@platejs/markdown";
import remarkGfm from "remark-gfm";

const MarkdownWithGfmPlugin = MarkdownPlugin.configure({
  options: {
    remarkPlugins: [remarkGfm],
  },
});

export const RichTextEditorPlugins = [
  BasicBlocksPlugin,
  BasicMarksPlugin,
  ListPlugin,
  MarkdownWithGfmPlugin,
];
