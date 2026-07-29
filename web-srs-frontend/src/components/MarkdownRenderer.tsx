import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col w-full text-slate-100 overflow-x-auto prose prose-invert prose-amber max-w-none wrap-break-word whitespace-pre-wrap [&_.katex]:text-slate-100 ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          pre({ children }) {
            return (
              <pre className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 my-4 overflow-x-auto shadow-inner relative group">
                {children}
              </pre>
            );
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isBlock = match || String(children).includes("\n");

            if (isBlock) {
              return (
                <>
                  {match && (
                    <span className="absolute right-3 top-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider select-none">
                      {match[1]}
                    </span>
                  )}
                  <code
                    className={`${className} text-sm font-mono text-slate-300`}
                    {...props}
                  >
                    {children}
                  </code>
                </>
              );
            }

            return (
              <code
                className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-amber-500/20 whitespace-nowrap"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
