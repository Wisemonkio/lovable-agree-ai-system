import React, { useEffect, useRef, useState } from 'react'
import { Bold, Italic, List, ListOrdered, Link, Type } from 'lucide-react'

interface JobDescriptionEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const JobDescriptionEditor: React.FC<JobDescriptionEditorProps> = ({
  value,
  onChange,
  placeholder = "Start typing your job description here..."
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [editorHeight, setEditorHeight] = useState(250)
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    bulletList: false,
    numberedList: false
  })

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newHeight = Math.max(250, Math.min(400, e.clientY - editorRef.current!.getBoundingClientRect().top))
        setEditorHeight(newHeight)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleSelectionChange = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        bulletList: document.queryCommandState('insertUnorderedList'),
        numberedList: document.queryCommandState('insertOrderedList')
      })
    }
  }

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleSelectionChange()
    handleInput()
  }

  const handleLinkInsert = () => {
    const selection = window.getSelection()
    const selectedText = selection?.toString()

    if (selectedText) {
      const url = prompt('Enter the URL:')
      if (url) {
        executeCommand('createLink', url)
      }
    } else {
      const linkText = prompt('Enter the link text:')
      if (linkText) {
        const url = prompt('Enter the URL:')
        if (url) {
          executeCommand('insertHTML', `<a href="${url}" target="_blank">${linkText}</a>`)
        }
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          executeCommand('bold')
          break
        case 'i':
          e.preventDefault()
          executeCommand('italic')
          break
      }
    }
  }

  const clearContent = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = ''
      onChange('')
    }
  }

  const getCharacterCount = () => {
    return editorRef.current?.textContent?.length || 0
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <h3 className="text-lg font-semibold">Job Description Editor</h3>
          <p className="text-blue-100 text-sm">Create compelling job descriptions with rich text formatting</p>
        </div>

        {/* Toolbar */}
        <div className="bg-gray-50 p-3 border-b border-gray-200">
          <div className="flex items-center space-x-1">
            {/* Formatting Buttons */}
            <div className="flex items-center space-x-1 mr-4">
              <button
                type="button"
                onClick={() => executeCommand('bold')}
                className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                  activeFormats.bold ? 'bg-blue-200 text-blue-800' : 'text-gray-600'
                }`}
                title="Bold (Ctrl+B)"
              >
                <Bold size={16} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand('italic')}
                className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                  activeFormats.italic ? 'bg-blue-200 text-blue-800' : 'text-gray-600'
                }`}
                title="Italic (Ctrl+I)"
              >
                <Italic size={16} />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* List Buttons */}
            <div className="flex items-center space-x-1 mr-4">
              <button
                type="button"
                onClick={() => executeCommand('insertUnorderedList')}
                className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                  activeFormats.bulletList ? 'bg-green-200 text-green-800' : 'text-gray-600'
                }`}
                title="Bullet List"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand('insertOrderedList')}
                className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                  activeFormats.numberedList ? 'bg-green-200 text-green-800' : 'text-gray-600'
                }`}
                title="Numbered List"
              >
                <ListOrdered size={16} />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* Link Button */}
            <button
              type="button"
              onClick={handleLinkInsert}
              className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600"
              title="Insert Link"
            >
              <Link size={16} />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onMouseUp={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            className="w-full p-4 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset min-h-[250px] overflow-y-auto"
            style={{ height: `${editorHeight}px`, maxHeight: '400px' }}
            data-placeholder={placeholder}
            suppressContentEditableWarning={true}
          />
          
          {/* Resize Handle */}
          <div
            className="absolute bottom-0 left-0 right-0 h-2 bg-gray-100 cursor-ns-resize hover:bg-gray-200 transition-colors flex items-center justify-center"
            onMouseDown={() => setIsResizing(true)}
          >
            <div className="w-8 h-0.5 bg-gray-400 rounded"></div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-3 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Characters: {getCharacterCount()}
          </div>
          <button
            type="button"
            onClick={clearContent}
            className="text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            Clear job description
          </button>
        </div>
      </div>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        
        [contenteditable] a {
          color: #2563eb;
          text-decoration: underline;
        }
        
        [contenteditable] ul,
        [contenteditable] ol {
          margin: 1rem 0;
          padding-left: 2rem;
        }
        
        [contenteditable] li {
          margin: 0.25rem 0;
        }
        
        [contenteditable] strong {
          font-weight: bold;
        }
        
        [contenteditable] em {
          font-style: italic;
        }
      `}</style>
    </div>
  )
}

export default JobDescriptionEditor
