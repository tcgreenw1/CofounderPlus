import React, { useState, useRef, KeyboardEvent } from 'react';
import { X, Tag as TagIcon } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  suggestions?: string[];
}

export function TagInput({ 
  tags, 
  onChange, 
  placeholder = 'Add tags...', 
  maxTags = 10,
  suggestions = []
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const addTag = (tag: string) => {
    if (tags.length >= maxTags) {
      return;
    }
    
    const normalizedTag = tag.toLowerCase().replace(/\s+/g, '-');
    
    if (!tags.includes(normalizedTag) && normalizedTag) {
      onChange([...tags, normalizedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const filteredSuggestions = suggestions.filter(
    suggestion => 
      !tags.includes(suggestion) && 
      suggestion.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          padding: 'var(--spacing-2)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          background: 'var(--background)',
          minHeight: '40px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--spacing-2)',
          alignItems: 'center',
          cursor: 'text',
        }}
      >
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            style={{
              fontSize: '0.75rem',
              background: 'rgba(139, 92, 246, 0.1)',
              color: '#8b5cf6',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-1)',
              paddingRight: 'var(--spacing-1)',
            }}
          >
            <TagIcon className="size-3" />
            {tag}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 'var(--spacing-1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                borderRadius: 'var(--radius-sm)',
              }}
              className="hover:bg-purple-200/50"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        
        {tags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(inputValue.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={tags.length === 0 ? placeholder : ''}
            style={{
              flex: 1,
              minWidth: '120px',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.875rem',
              padding: 'var(--spacing-1)',
            }}
          />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 'var(--spacing-1)',
            padding: 'var(--spacing-2)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--card)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 50,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          <p className="text-xs text-muted-foreground" style={{ marginBottom: 'var(--spacing-2)', paddingLeft: 'var(--spacing-2)' }}>
            Suggestions
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => addTag(suggestion)}
                style={{
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2)',
                }}
                className="hover:bg-muted transition-colors"
              >
                <TagIcon className="size-3" style={{ color: '#8b5cf6' }} />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {tags.length >= maxTags && (
        <p className="text-xs text-muted-foreground" style={{ marginTop: 'var(--spacing-1)' }}>
          Maximum {maxTags} tags reached
        </p>
      )}
    </div>
  );
}
