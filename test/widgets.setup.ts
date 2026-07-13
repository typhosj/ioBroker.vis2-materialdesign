class TestVisRxWidget {
    static t(value: string): string {
        return value;
    }

    render(): null {
        return null;
    }
}

Object.defineProperty(window, 'visRxWidget', { configurable: true, value: TestVisRxWidget });
