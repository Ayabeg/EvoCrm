import { Clock, Compass, Lightning, MagnifyingGlass, Sparkle, Star } from "@phosphor-icons/react"
import * as React from "react"
import { Button } from "@/components/ui/aurora/button"
import { Input } from "@/components/ui/input"
import { restoreFocus, trapTabKey } from "@/lib/a11y"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommandSection = "recent" | "actions" | "skills" | "navigate"

export interface CommandSectionDef {
  id: string
  label: string
}

export interface CommandItem {
  id: string
  label: string
  description?: string
  /** Section id — one of the palette's `sections` (defaults to recent/actions/skills/navigate) */
  section: string
  /** Keyboard shortcut display (e.g. ["⌘", "K"]) */
  shortcut?: string[]
  /** Optional icon element shown in the result tile. */
  icon?: React.ReactNode
  onSelect?: () => void
}

export interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CommandItem[]
  onSelect?: (item: CommandItem) => void
  /** Section order + labels. Defaults to the recent/actions/skills/navigate set. */
  sections?: CommandSectionDef[]
  placeholder?: string
  /**
   * Optional scorer: return 0 to drop an item, higher to rank it earlier.
   * When omitted, a case-insensitive substring match on label/description is
   * used and the incoming item order is kept.
   */
  filter?: (query: string, item: CommandItem) => number
  /** Controlled query. When omitted, the palette keeps its own draft. */
  query?: string
  onQueryChange?: (query: string) => void
  statusText?: string
}

// ---------------------------------------------------------------------------
// useCommandPalette hook
// ---------------------------------------------------------------------------

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", handler)

    return () => document.removeEventListener("keydown", handler)
  }, [])

  return { open, setOpen, onOpenChange: setOpen }
}

// ---------------------------------------------------------------------------
// Default items (demo)
// ---------------------------------------------------------------------------

const DEFAULT_ITEMS: CommandItem[] = [
  {
    id: "r1",
    label: "Chat with Claude",
    description: "Recent conversation",
    section: "recent",
    icon: <Clock size={14} weight="regular" aria-hidden />,
  },
  {
    id: "r2",
    label: "Aurora Design System",
    description: "Opened 2h ago",
    section: "recent",
    icon: <Clock size={14} weight="regular" aria-hidden />,
  },
  {
    id: "a1",
    label: "New conversation",
    description: "Start a fresh chat",
    section: "actions",
    shortcut: ["⌘", "N"],
    icon: <Lightning size={14} weight="regular" aria-hidden />,
  },
  {
    id: "a2",
    label: "Search files",
    description: "Search across your project",
    section: "actions",
    shortcut: ["⌘", "F"],
    icon: <MagnifyingGlass size={14} weight="regular" aria-hidden />,
  },
  {
    id: "a3",
    label: "Clear conversation",
    description: "Wipe current context",
    section: "actions",
    shortcut: ["⌘", "⇧", "K"],
    icon: <Lightning size={14} weight="regular" aria-hidden />,
  },
  {
    id: "s1",
    label: "Code review",
    description: "AI-powered code reviewer",
    section: "skills",
    icon: <Sparkle size={14} weight="regular" aria-hidden />,
  },
  {
    id: "s2",
    label: "Security review",
    description: "Audit for vulnerabilities",
    section: "skills",
    icon: <Star size={14} weight="regular" aria-hidden />,
  },
  {
    id: "n1",
    label: "Settings",
    description: "Open preferences",
    section: "navigate",
    shortcut: ["⌘", ","],
    icon: <Compass size={14} weight="regular" aria-hidden />,
  },
  {
    id: "n2",
    label: "Documentation",
    description: "Browse Aurora docs",
    section: "navigate",
    icon: <Compass size={14} weight="regular" aria-hidden />,
  },
]

const DEFAULT_SECTIONS: CommandSectionDef[] = [
  { id: "recent", label: "Recent" },
  { id: "actions", label: "Actions" },
  { id: "skills", label: "Skills" },
  { id: "navigate", label: "Navigate" },
]

// ---------------------------------------------------------------------------
// Keyboard shortcut badge
// ---------------------------------------------------------------------------

function KbdBadge({ keys }: { keys: string[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
      {keys.map((k, i) => (
        <kbd
          key={i}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1px 5px",
            minWidth: "18px",
            background: "var(--aurora-control-surface)",
            border: "1px solid var(--aurora-border-strong)",
            borderRadius: "5px",
            fontSize: "12px",
            fontFamily: "var(--aurora-font-mono)",
            fontWeight: 500,
            color: "var(--aurora-text-muted)",
            lineHeight: "16px",
          }}
        >
          {k}
        </kbd>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

// Styles: registry/aurora/styles/aurora-components.css (@layer aurora-components).

function isCommitKey(event: React.KeyboardEvent): boolean {
  if (event.key !== "Enter") {
    return false
  }

  if (event.nativeEvent.isComposing || event.keyCode === 229) {
    return false
  }

  return true
}

export function CommandPalette({
  open,
  onOpenChange,
  items = DEFAULT_ITEMS,
  onSelect,
  sections = DEFAULT_SECTIONS,
  placeholder = "Search commands, skills, files…",
  filter,
  query: queryProp,
  onQueryChange,
  statusText,
}: CommandPaletteProps) {
  const [uncontrolledQuery, setUncontrolledQuery] = React.useState("")
  const query = queryProp ?? uncontrolledQuery
  const setQuery = React.useCallback((next: string) => {
    if (queryProp === undefined) {
      setUncontrolledQuery(next)
    }

    onQueryChange?.(next)
  }, [onQueryChange, queryProp])
  const [activeIdx, setActiveIdx] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const openerRef = React.useRef<HTMLElement | null>(null)
  const reactId = React.useId()
  const listboxId = `${reactId}-cmd-palette-listbox`

  // Filter
  const filtered = query.trim()
    ? filter
      ? items
          .map((item) => ({ item, score: filter(query, item) }))
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((x) => x.item)
      : items.filter(
          (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase())
        )
    : items

  // Group by section in order
  const grouped = sections.flatMap(({ id, label }) => {
    const sectionItems = filtered.filter((i) => i.section === id)

    if (sectionItems.length === 0) {
return []
}

    return [{ section: id, label, items: sectionItems }]
  })

  const flatItems = grouped.flatMap((g) => g.items)
  const activeItem = flatItems[activeIdx]
  const activeOptionId = activeItem ? `${reactId}-cmd-option-${activeItem.id}` : undefined

  // Focus input when open; restore the opener when closed
  React.useEffect(() => {
    if (open) {
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      setTimeout(() => inputRef.current?.focus(), 0)

      return
    }

    restoreFocus(openerRef.current)
    openerRef.current = null
  }, [open])

  // Escape key
  React.useEffect(() => {
    if (!open) {
return
}

    function handler(e: KeyboardEvent) {
      if (e.key !== "Escape") {
        return
      }

      e.preventDefault()
      e.stopPropagation()
      onOpenChange(false)
    }
    document.addEventListener("keydown", handler, true)

    return () => document.removeEventListener("keydown", handler, true)
  }, [open, onOpenChange])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (dialogRef.current) {
      trapTabKey(e, dialogRef.current)
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx((i) => (i + 1) % Math.max(flatItems.length, 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => (i - 1 + flatItems.length) % Math.max(flatItems.length, 1))
    } else if (isCommitKey(e)) {
      e.preventDefault()
      const item = flatItems[activeIdx]

      if (item) {
fire(item)
}
    }
  }

  function fire(item: CommandItem) {
    item.onSelect?.()
    onSelect?.(item)
    setQuery("")
    setActiveIdx(0)
    onOpenChange(false)
  }

  // Scroll active item into view
  React.useEffect(() => {
    if (!listRef.current) {
return
}

    const el = listRef.current.querySelector(`[data-active="true"]`) as HTMLElement | null
    el?.scrollIntoView({ block: "nearest" })
  }, [activeIdx])

  if (!open) {
return null
}

  let flatIndex = 0

  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        data-command="backdrop"
        onClick={() => {
          setQuery("")
          setActiveIdx(0)
          onOpenChange(false)
        }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "var(--aurora-overlay)",
          animation: "aurora-backdrop-in var(--motion-duration-page) var(--motion-ease-out)",
        }}
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        data-command="os"
        data-a11y="focus-trap"
        onKeyDown={handleKeyDown}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 201,
          width: "560px",
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--aurora-radius-3)",
          boxShadow: "var(--aurora-shadow-strong), var(--aurora-highlight-strong)",
          overflow: "hidden",
          overflowX: "hidden",
          animation: "evocrm-command-in var(--motion-duration-modal) var(--motion-ease-out)",
        }}
      >
        {/* Search row */}
        <div
          className="aurora-cmd-search-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderBottom: "1px solid var(--aurora-border-default)",
            transition: "border-bottom-color var(--motion-duration-hover) var(--motion-ease-out), box-shadow var(--motion-duration-hover) var(--motion-ease-out)",
          }}
        >
          <span style={{ color: "var(--aurora-text-muted)", flexShrink: 0 }}>
            <MagnifyingGlass size={16} weight="regular" aria-hidden />
          </span>
          <Input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={true}
            aria-controls={listboxId}
            aria-activedescendant={activeOptionId}
            aria-autocomplete="list"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIdx(0)
            }}
            placeholder={placeholder}
            aria-label="Search commands"
            className="h-auto border-none px-0 py-0 focus-visible:outline-none"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "var(--aurora-text-primary)",
              fontFamily: "var(--aurora-font-sans)",
              caretColor: "var(--aurora-accent-primary)",
            }}
          />
          <KbdBadge keys={["⌘", "K"]} />
        </div>

        {/* Results */}
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Command results"
          style={{
            overflowY: "auto",
            overflowX: "hidden",
            flex: 1,
            padding: "8px",
          }}
        >
          {grouped.length === 0 ? (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                fontSize: "13px",
                color: "var(--aurora-text-muted)",
              }}
            >
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            grouped.map(({ section, label, items: sItems }) => (
              <div key={section}>
                {/* Section header */}
                <div
                  style={{
                    padding: "8px 16px 4px",
                    fontSize: "12px",
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    textTransform: "none",
                    color: "var(--aurora-text-muted)",
                  }}
                >
                  {label}
                </div>

                {sItems.map((item) => {
                  const idx = flatIndex++
                  const isActive = idx === activeIdx

                  return (
                    <Button variant="plain" size="unstyled"
                      key={item.id}
                      id={`${reactId}-cmd-option-${item.id}`}
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive}
                      onClick={() => fire(item)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                        minHeight: "36px",
                        padding: "8px 16px",
                        background: isActive ? "var(--color-accent-soft)" : "transparent",
                        border: "none",
                        borderRadius: "8px",
                        borderLeft: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        overflow: "hidden",
                        transition: "background var(--motion-duration-hover) var(--motion-ease-out)",
                      }}
                    >
                      {/* Icon */}
                      <span
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "8px",
                          background: "transparent",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: isActive ? "var(--aurora-accent-primary)" : "var(--aurora-text-muted)",
                          transition: "color var(--motion-duration-hover) var(--motion-ease-out)",
                        }}
                      >
                        {item.icon}
                      </span>

                      {/* Label + description */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "var(--aurora-text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontFamily: "var(--aurora-font-sans)",
                          }}
                        >
                          {item.label}
                        </div>
                        {item.description && (
                          <div
                            style={{
                          fontSize: "12px",
                          color: "var(--aurora-text-muted)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>

                      {/* Shortcut */}
                      {item.shortcut && <KbdBadge keys={item.shortcut} />}
                    </Button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "7px 16px",
            borderTop: "1px solid var(--aurora-border-default)",
            background: "var(--aurora-panel-medium)",
          }}
        >
          {statusText ? (
            <span style={{ fontSize: "12px", color: "var(--aurora-text-muted)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {statusText}
            </span>
          ) : null}
          {[
            { keys: ["↑", "↓"], label: "Navigate" },
            { keys: ["↵"], label: "Select" },
            { keys: ["Esc"], label: "Close" },
          ].map(({ keys, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <KbdBadge keys={keys} />
              <span style={{ fontSize: "12px", color: "var(--aurora-text-muted)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default CommandPalette
