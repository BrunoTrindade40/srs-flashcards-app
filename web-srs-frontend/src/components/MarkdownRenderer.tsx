import React, { Component, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

class MarkdownErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : "Erro sintético irreversível.";
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Falha ao renderizar Markdown/LaTeX:", error.message, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col w-full p-4 bg-rose-950/30 border border-rose-900/50 rounded-xl gap-2 text-rose-300">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
            Falha de Renderização Visual
          </span>
          <p className="text-sm leading-relaxed">
            O conteúdo estrutural deste cartão contém sintaxe inválida que impediu a exibição correta.
          </p>
          <code className="text-[10px] font-mono bg-rose-950 p-2 rounded border border-rose-900 overflow-x-auto whitespace-pre-wrap">
            {this.state.errorMessage}
          </code>
        </div>
      );
    }
    return this.props.children;
  }
}

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
      // CRÍTICO (RESOLVIDO): O componente agora é um "Agnostic Wrapper".
      // A responsabilidade de injetar "prose-invert text-slate-100" ou "prose-slate text-slate-700" 
      // é delegada estritamente ao componente pai através da prop 'className'.
      className={`flex flex-col w-full overflow-x-auto prose max-w-none wrap-break-word whitespace-pre-wrap ${className}`}
    >
      <MarkdownErrorBoundary>
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
      </MarkdownErrorBoundary>
    </div>
  );
};