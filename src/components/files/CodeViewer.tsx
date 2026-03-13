'use client'

import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, CheckCheck, Code } from 'lucide-react'
import toast from 'react-hot-toast'

const LANGUAGE_LABELS: Record<string, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  sql: 'SQL',
  json: 'JSON',
  css: 'CSS',
  scss: 'SCSS',
  html: 'HTML',
  markdown: 'Markdown',
  bash: 'Bash',
  yaml: 'YAML',
  go: 'Go',
  rust: 'Rust',
  ruby: 'Ruby',
  java: 'Java',
  csharp: 'C#',
  cpp: 'C++',
  c: 'C',
  php: 'PHP',
}

const LANGUAGE_COLORS: Record<string, string> = {
  typescript: 'bg-blue-100 text-blue-700',
  javascript: 'bg-yellow-100 text-yellow-700',
  python: 'bg-green-100 text-green-700',
  sql: 'bg-orange-100 text-orange-700',
  json: 'bg-slate-100 text-slate-600',
  css: 'bg-pink-100 text-pink-700',
  html: 'bg-red-100 text-red-700',
  bash: 'bg-slate-900/10 text-slate-700',
  go: 'bg-cyan-100 text-cyan-700',
  rust: 'bg-orange-100 text-orange-800',
  ruby: 'bg-red-100 text-red-700',
  yaml: 'bg-purple-100 text-purple-700',
}

interface CodeViewerProps {
  content: string
  language?: string
  fileName?: string
  maxHeight?: number
}

export function CodeViewer({ content, language = 'text', fileName, maxHeight = 400 }: CodeViewerProps) {
  const [copied, setCopied] = useState(false)
  const lineCount = content.split('\n').length
  const langLabel = LANGUAGE_LABELS[language] ?? language.toUpperCase()
  const langColor = LANGUAGE_COLORS[language] ?? 'bg-slate-100 text-slate-600'

  function handleCopy() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50">
        <Code size={13} className="text-slate-400 shrink-0" />
        {fileName && (
          <span className="text-xs font-mono text-slate-600 truncate flex-1">{fileName}</span>
        )}
        <span className={`badge text-xs shrink-0 ${langColor}`}>{langLabel}</span>
        <span className="text-xs text-slate-400 shrink-0">{lineCount} lines</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors shrink-0"
        >
          {copied ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Code */}
      <div className="overflow-auto" style={{ maxHeight }}>
        <SyntaxHighlighter
          language={language === 'text' ? 'plaintext' : language}
          style={oneLight}
          showLineNumbers
          lineNumberStyle={{
            color: '#94a3b8',
            fontSize: '11px',
            paddingRight: '16px',
            userSelect: 'none',
            minWidth: '2.5em',
          }}
          customStyle={{
            margin: 0,
            padding: '12px 0',
            background: '#ffffff',
            fontSize: '12.5px',
            lineHeight: '1.6',
            fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", ui-monospace, monospace',
          }}
          codeTagProps={{
            style: { fontFamily: 'inherit' },
          }}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
