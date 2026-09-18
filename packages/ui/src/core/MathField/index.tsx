import type { MathfieldElement } from 'mathlive';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';
import { Label } from '../Label';
import { MATHLIVE_READY_EVENT, hideVirtualKeyboard } from './virtual-keyboard';

export interface IMathLiveConfig {
  /**
   * Public URL of MathLive's font directory. MathLive resolves its default relative to the script
   * URL, which under Next lands inside `/_next/static/chunks` where the fonts are not — and the
   * failure is silent: the equation renders in a fallback face and is subtly wrong rather than
   * visibly broken. Copy `node_modules/mathlive/fonts` into the app's `public/` and point here.
   * `null` disables font loading and accepts the degraded rendering.
   */
  fontsDirectory: string | null;
  /** `null` disables the keypress sounds, which no screen in this product wants. */
  soundsDirectory: string | null;
}

let mathLiveConfig: IMathLiveConfig = { fontsDirectory: null, soundsDirectory: null };

/**
 * Set once, from the app, before the first field mounts. The values are MathLive statics shared by
 * every instance, so they cannot be per-field props without one field's value silently winning.
 */
export const configureMathLive = (config: Partial<IMathLiveConfig>) => {
  mathLiveConfig = { ...mathLiveConfig, ...config };
};

/** True on a phone or tablet, where a finger is the pointer and there is no physical keyboard. */
const hasCoarsePointer = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

/** The imperative handle a toolbar or palette needs to write into a focused field. */
export interface IMathFieldHandle {
  /** Inserts at the caret. `#?` in the LaTeX becomes a tab-stop placeholder. */
  insert: (latex: string) => void;
  focus: () => void;
  getValue: () => string;
}

export interface IMathFieldProps {
  /** LaTeX source. This component is controlled. */
  value: string;
  onChange: (latex: string) => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  /** Commit — Enter with the caret at the top level of the expression. */
  onSubmit?: () => void;
  /** Cancel — Escape. */
  onCancel?: () => void;
  /** Fires once the element exists, handing back the imperative handle. */
  onReady?: (handle: IMathFieldHandle) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Wrapper classes. */
  className?: string;
  /** Classes on the `<math-field>` element itself. */
  fieldClassName?: string;
}

/**
 * A live math field: the typeset equation is the editable surface.
 *
 * Wraps MathLive's `<math-field>` custom element. The element is created imperatively rather than
 * rendered as JSX because React would otherwise reconcile a node whose entire subtree MathLive
 * owns, and because `value` on a custom element is a property, not an attribute — JSX sets
 * attributes, so a rendered `<math-field value={...}>` silently does nothing after first paint.
 *
 * MathLive is imported dynamically: defining a custom element touches `window`, so a static import
 * breaks the Pages Router's server render. That also keeps roughly 300 KB out of any bundle that
 * does not author equations — the read-only path uses `MathRender` instead.
 */
export const MathField = ({
  value,
  onChange,
  label,
  required,
  error,
  helperText,
  readOnly,
  autoFocus,
  onSubmit,
  onCancel,
  onReady,
  onFocus,
  onBlur,
  className,
  fieldClassName,
}: IMathFieldProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<MathfieldElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isReady, setIsReady] = useState(false);

  /**
   * The handlers are read through refs inside listeners bound once for the element's lifetime.
   * Re-binding them when a caller passes a new closure would mean tearing the element down on
   * every parent render, which loses the caret.
   */
  const handlers = useRef({ onChange, onSubmit, onCancel, onFocus, onBlur });
  handlers.current = { onChange, onSubmit, onCancel, onFocus, onBlur };
  const initialValue = useRef(value);

  useEffect(() => {
    let isCancelled = false;
    let field: MathfieldElement | null = null;
    const host = hostRef.current;

    const load = async () => {
      const mathlive = await import('mathlive');
      if (isCancelled || !host) return;

      mathlive.MathfieldElement.fontsDirectory = mathLiveConfig.fontsDirectory;
      mathlive.MathfieldElement.soundsDirectory = mathLiveConfig.soundsDirectory;
      // The keyboard's own layer defaults to 105, well under the drawer (1300) and its popovers
      // (1400), so inside a drawer most of the keys were painted over. 1450 puts it above both and
      // below the floating "Hide keyboard" control (1600). MathLive reads the variable from the
      // element the keyboard is mounted in, which is the body.
      document.body.style.setProperty('--keyboard-zindex', '1450');

      field = new mathlive.MathfieldElement();
      field.value = initialValue.current;
      // On a touch device the on-screen keyboard is the keyboard, so it appears with focus. With a
      // pointer it is ours to toggle: left on 'auto' it would pop up on every desktop focus too.
      field.mathVirtualKeyboardPolicy = hasCoarsePointer() ? 'auto' : 'manual';
      /**
       * Off, deliberately, and it is the inline shortcuts that depend on it.
       *
       * `smartMode` switches between maths and prose as you type, so a run of letters is taken for
       * a word: `sqrt` becomes `\text{sqrt}` and `alpha` becomes `\text{alpha}` instead of a radical
       * and an α. Measured against the shortcuts this product actually promises — with it on,
       * `sqrt` and `alpha` fail while `pi` and `1/2` survive, which is worse than either extreme
       * because the rule an author infers from `pi` then silently fails them on `sqrt`.
       */
      field.smartMode = false;
      /**
       * `select-text` is not cosmetic — caret placement depends on it.
       *
       * MathLive positions the caret from the pointer event, but declines to when the element
       * computes `user-select: none`, and that value is inherited (it crosses the shadow boundary
       * into the field's own internals). Any host that sets it on an ancestor therefore breaks
       * clicking into the expression while leaving typing and the palette working — ProseMirror's
       * draggable node-view wrapper does exactly this. Declaring it on the element itself beats the
       * inherited value wherever the field is embedded.
       */
      /**
       * `text-foreground` is required, not decorative: MathLive renders its own text rather than
       * inheriting a colour the way KaTeX output does (which uses `currentColor`). Left unset the
       * field draws near-black glyphs, which are legible on the light theme and all but invisible
       * on the dark one — the expression looks blank while the chrome around it looks right.
       */
      field.className = cn(
        'block w-full select-text bg-transparent px-2 py-1.5 text-base text-foreground outline-none',
        fieldClassName,
      );
      // MathLive's own theming hooks. The caret and selection are drawn by the component and do not
      // follow `color`, so they need pointing at the tokens explicitly or they keep their defaults.
      field.style.setProperty('--caret-color', 'currentColor');
      field.style.setProperty('--selection-background-color', 'hsl(var(--primary) / 0.25)');
      field.style.setProperty('--contains-highlight-background-color', 'hsl(var(--accent))');
      field.style.setProperty('--placeholder-color', 'hsl(var(--muted-foreground))');

      field.addEventListener('input', () => {
        if (field) handlers.current.onChange(field.value);
      });
      field.addEventListener('focus', () => {
        setIsFocused(true);
        handlers.current.onFocus?.();
      });
      field.addEventListener('blur', () => {
        setIsFocused(false);
        handlers.current.onBlur?.();
      });
      // Capture phase: MathLive consumes both keys itself, Enter to insert a row in a matrix and
      // Escape to dismiss its own menus, so a bubbling listener never sees them.
      field.addEventListener(
        'keydown',
        (event: KeyboardEvent) => {
          if (event.key === 'Enter' && handlers.current.onSubmit) {
            event.preventDefault();
            event.stopPropagation();
            handlers.current.onSubmit();
          }
          if (event.key === 'Escape' && handlers.current.onCancel) {
            event.preventDefault();
            event.stopPropagation();
            handlers.current.onCancel();
          }
        },
        true,
      );

      host.appendChild(field);
      fieldRef.current = field;
      setIsReady(true);
      // The keyboard global exists from here on; anything watching it can subscribe now.
      window.dispatchEvent(new Event(MATHLIVE_READY_EVENT));

      onReady?.({
        insert: (latex: string) => field?.insert(latex, { focus: true }),
        focus: () => field?.focus(),
        getValue: () => field?.value ?? '',
      });

      // Focusing on the frame the element is appended does not land: the custom element has only
      // just upgraded, and when this field is inside a ProseMirror node view the editor reclaims
      // focus as the surrounding transaction settles. Without the deferral the field opens looking
      // focused while every keystroke goes to the document behind it, so the author types once,
      // sees nothing happen, and clicks again.
      if (autoFocus) {
        requestAnimationFrame(() => {
          if (isCancelled || !field) return;
          field.focus();
          // `focus()` alone selects the whole expression, the way focusing a text input does. For a
          // field that opens on an *existing* equation that is destructive: the author clicks an
          // equation to change one character, types, and the selection is replaced — their formula
          // is gone. Collapsing to the end makes typing extend the expression instead.
          field.executeCommand('moveToMathfieldEnd');
        });
      }
    };

    void load();

    return () => {
      isCancelled = true;
      field?.remove();
      fieldRef.current = null;
      // The keyboard is a window singleton and does not follow its field; left up after the field
      // is gone it covers the page with nothing to type into.
      hideVirtualKeyboard();
    };
  }, []);

  // External writes only. The guard is what stops the field fighting the caller during typing:
  // every keystroke round-trips through `onChange` and back as a new `value`, and re-setting an
  // already-equal value would reset the caret to the end of the expression on each character.
  useEffect(() => {
    const field = fieldRef.current;
    if (field && field.value !== value) field.value = value;
  }, [value, isReady]);

  useEffect(() => {
    const field = fieldRef.current;
    if (field) field.readOnly = Boolean(readOnly);
  }, [readOnly, isReady]);

  let borderClass = 'border-border';
  if (isFocused) borderClass = 'border-primary ring-1 ring-primary';
  else if (error) borderClass = 'border-destructive';

  return (
    <div className={className}>
      {label ? <Label label={label} required={required} /> : null}
      <div className={cn('flex min-h-[2.5rem] items-center border bg-background transition-colors', borderClass)}>
        <div ref={hostRef} className="w-full" />
        {isReady ? null : <span className="px-2 text-sm text-muted-foreground">Loading equation editor…</span>}
      </div>
      {helperText ? (
        <p className={cn('mt-1 text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>{helperText}</p>
      ) : null}
    </div>
  );
};
