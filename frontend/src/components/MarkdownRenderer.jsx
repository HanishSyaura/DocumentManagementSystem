import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownRenderer({ value, className, style, inline = false }) {
  const v = typeof value === 'string' ? value : ''

  const blockComponents = {
    p: ({ ...props }) => <p className="leading-relaxed" {...props} />,
    ul: ({ ...props }) => <ul className="list-disc pl-5 space-y-1" {...props} />,
    ol: ({ ...props }) => <ol className="list-decimal pl-5 space-y-1" {...props} />,
    li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
    a: ({ ...props }) => <a className="underline" target="_blank" rel="noreferrer" {...props} />
  }

  if (inline) {
    return (
      <span className={className} style={style}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            ...blockComponents,
            p: ({ children }) => <span>{children}</span>,
            ul: ({ children }) => <span>{children}</span>,
            ol: ({ children }) => <span>{children}</span>,
            li: ({ children }) => <span>{children}</span>
          }}
        >
          {v}
        </ReactMarkdown>
      </span>
    )
  }

  return (
    <div className={className} style={style}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={blockComponents}>
        {v}
      </ReactMarkdown>
    </div>
  )
}
