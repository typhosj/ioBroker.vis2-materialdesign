import React from 'react';

export function Card({ title, toolbar, children, className }: { title?: string; toolbar?: React.ReactNode; children: React.ReactNode; className?: string }): React.JSX.Element {
    return (
        <section className={`g-card${className ? ` ${className}` : ''}`}>
            {title || toolbar ? <header className="g-card-header">{title ? <h2>{title}</h2> : null}{toolbar ? <div className="g-card-toolbar">{toolbar}</div> : null}</header> : null}
            {children}
        </section>
    );
}
