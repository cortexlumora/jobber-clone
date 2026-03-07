import { createContext, useContext, useEffect, useRef, useState } from "react";

interface StickyFooterContextValue {
	isAtBottom: boolean;
	sentinelRef: React.RefObject<HTMLDivElement | null>;
}

const StickyFooterContext = createContext<StickyFooterContextValue | null>(null);

function Root({ children }: { children: React.ReactNode }) {
	const [isAtBottom, setIsAtBottom] = useState(false);
	const sentinelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => setIsAtBottom(entry.isIntersecting),
			{ threshold: 0 }
		);
		if (sentinelRef.current) observer.observe(sentinelRef.current);
		return () => observer.disconnect();
	}, []);

	return (
		<StickyFooterContext.Provider value={{ isAtBottom, sentinelRef }}>
			<div className="-m-4 flex flex-col min-h-[calc(100vh-3.5rem)]">
				{children}
			</div>
		</StickyFooterContext.Provider>
	);
}

function Content({ children, className }: { children: React.ReactNode; className?: string }) {
	const ctx = useContext(StickyFooterContext);
	return (
		<div className="flex-1 p-4">
			<div className={className}>
				{children}
				<div ref={ctx?.sentinelRef} />
			</div>
		</div>
	);
}

function Bar({ left, right }: { left?: React.ReactNode; right?: React.ReactNode }) {
	const ctx = useContext(StickyFooterContext);
	const isAtBottom = ctx?.isAtBottom ?? false;

	return (
		<div className={`sticky bottom-0 bg-background py-4 px-4 transition-shadow ${isAtBottom ? "" : "shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"}`}>
			<div className="max-w-2xl mx-auto flex items-center justify-between">
				<div className="flex gap-2">{left}</div>
				<div className="flex gap-2">{right}</div>
			</div>
		</div>
	);
}

export const StickyFooter = { Root, Content, Bar };
