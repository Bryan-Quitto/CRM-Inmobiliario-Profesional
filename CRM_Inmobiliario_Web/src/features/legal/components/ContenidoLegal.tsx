/* eslint-disable @typescript-eslint/no-unused-vars */
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  content: string;
}

export const ContenidoLegal = ({ content }: Props) => {
  return (
    <div className="text-slate-700 text-sm md:text-base leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}) => <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg md:text-xl font-semibold text-slate-800 mt-6 mb-3" {...props} />,
          p: ({node, ...props}) => <p className="mb-4" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-2" {...props} />,
          li: ({node, ...props}) => <li className="pl-1" {...props} />,
          a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer" target="_blank" rel="noopener noreferrer" {...props} />,
          strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
          em: ({node, ...props}) => <em className="italic" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-300 pl-4 italic my-4 text-slate-600" {...props} />,
          code: ({node, ...props}) => <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
          hr: ({node, ...props}) => <hr className="my-8 border-slate-200" {...props} />,
          table: ({node, ...props}) => (
            <div className="overflow-x-auto my-6">
              <table className="w-full text-left border-collapse border border-slate-200 rounded-lg" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200" {...props} />,
          tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-200" {...props} />,
          tr: ({node, ...props}) => <tr className="hover:bg-slate-50 transition-colors" {...props} />,
          th: ({node, ...props}) => <th className="px-4 py-3 border border-slate-200" {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-3 border border-slate-200" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
