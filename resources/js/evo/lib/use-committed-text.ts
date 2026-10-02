import * as React from 'react';

/**
 * Keep a draft string in sync with a committed prop without an effect.
 * React Compiler / eslint: adjust state during render when the source changes.
 */
export function useCommittedText<T>(value: T, toText: (value: T) => string): [string, React.Dispatch<React.SetStateAction<string>>] {
    const [text, setText] = React.useState(() => toText(value));
    const [seen, setSeen] = React.useState(value);

    if (!Object.is(value, seen)) {
        setSeen(value);
        setText(toText(value));
    }

    return [text, setText];
}
