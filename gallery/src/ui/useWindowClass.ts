import { useEffect, useState } from 'react';

export type WindowClass = 'compact' | 'medium' | 'expanded' | 'large';

export function windowClassFor(width: number): WindowClass {
    return width < 600 ? 'compact' : width < 1240 ? 'medium' : width < 1600 ? 'expanded' : 'large';
}

export function useWindowClass(): WindowClass {
    const [value, setValue] = useState(() => windowClassFor(window.innerWidth));
    useEffect(() => {
        const update = (): void => setValue(windowClassFor(window.innerWidth));
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);
    return value;
}
