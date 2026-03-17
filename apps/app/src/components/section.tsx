interface SectionProps {
	title: string;
	action?: React.ReactNode;
	children: React.ReactNode;
}

const Section = ({ title, action, children }: SectionProps) => {
	return (
		<div className="rounded-lg border bg-background">
			<div className="px-5 py-3 border-b flex items-center justify-between min-h-14">
				<h3 className="text-sm font-semibold">{title}</h3>
				{action}
			</div>
			<div className="px-5 py-4">{children}</div>
		</div>
	);
};

export default Section;
