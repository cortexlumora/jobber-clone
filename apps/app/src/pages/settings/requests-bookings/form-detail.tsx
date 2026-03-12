import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
	DndContext,
	DragOverlay,
	useDraggable,
	useDroppable,
	type DragStartEvent,
	type DragEndEvent,
	pointerWithin,
} from "@dnd-kit/core";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
	arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FieldWrapper, type FieldType, type FormField } from "./components/fields";
import { DropIndicator } from "./components/drop-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	ArrowLeft,
	GripVertical,
	MoreHorizontal,
	AlignLeft,
	AlignJustify,
	ChevronDown,
	ListChecks,
	CheckSquare,
	CircleDot,
	Hash,
	ImageUp,
	ToggleLeft,
	CalendarDays,
	Ruler,
	MapPin,
	Building2,
	Mail,
	Phone,
	UserSearch,
	ShoppingCart,
	Plus,
} from "lucide-react";
import { getRequestForms } from "../api";

interface FormSection {
	id: string;
	title: string;
	fields: FormField[];
}

// ─── Sidebar item config ─────────────────────────────────────────
const SIDEBAR_ITEMS: { category: string; description?: string; items: { type: FieldType | "section"; label: string; icon: React.ElementType }[] }[] = [
	{
		category: "Layout options",
		items: [
			{ type: "section", label: "Add section", icon: Plus },
		],
	},
	{
		category: "Custom questions",
		description: "Select the type of question you'd like to ask",
		items: [
			{ type: "short_answer", label: "Short answer", icon: AlignLeft },
			{ type: "long_answer", label: "Long answer", icon: AlignJustify },
			{ type: "dropdown_multi", label: "Dropdown (multi choice)", icon: ListChecks },
			{ type: "dropdown_single", label: "Dropdown (single choice)", icon: ChevronDown },
			{ type: "checkbox", label: "Checkbox", icon: CheckSquare },
			{ type: "radio", label: "Radio button (single choice)", icon: CircleDot },
			{ type: "number", label: "Numerical answer", icon: Hash },
			{ type: "image_upload", label: "Upload images", icon: ImageUp },
			{ type: "yes_no", label: "Yes/No toggle", icon: ToggleLeft },
			{ type: "date", label: "Date picker", icon: CalendarDays },
			{ type: "area", label: "Area", icon: Ruler },
		],
	},
	{
		category: "Standardized questions",
		items: [
			{ type: "address", label: "Address", icon: MapPin },
			{ type: "company_name", label: "Company name", icon: Building2 },
			{ type: "email", label: "Email", icon: Mail },
			{ type: "phone", label: "Phone number", icon: Phone },
			{ type: "lead_source", label: "Lead source", icon: UserSearch },
		],
	},
	{
		category: "Actions",
		items: [
			{ type: "products_services", label: "Add products and services", icon: ShoppingCart },
		],
	},
];

// ─── Default sections ────────────────────────────────────────────
const DEFAULT_SECTIONS: FormSection[] = [
	{
		id: "section-contact",
		title: "Contact information",
		fields: [
			{ id: "field-name", type: "name_group", label: "Name" },
			{ id: "field-company", type: "company_name", label: "Company name" },
			{ id: "field-email", type: "email", label: "Email" },
			{ id: "field-phone", type: "phone", label: "Phone" },
			{ id: "field-address", type: "address", label: "Street address" },
		],
	},
	{
		id: "section-service",
		title: "Service details",
		fields: [
			{ id: "field-description", type: "long_answer", label: "Please provide as much information as you can", required: true },
			{ id: "field-images", type: "image_upload", label: "Share images of the work to be done" },
			{ id: "field-lead", type: "lead_source", label: "How did you hear about us?" },
		],
	},
];

let nextId = 1;
const genId = (prefix: string) => `${prefix}-${Date.now()}-${nextId++}`;

// ─── Draggable sidebar item ─────────────────────────────────────
function SidebarDraggableItem({ type, label, icon: Icon }: { type: string; label: string; icon: React.ElementType }) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `sidebar-${type}`,
		data: { origin: "sidebar", type },
	});

	return (
		<button
			ref={setNodeRef}
			{...listeners}
			{...attributes}
			className={`flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left cursor-grab active:cursor-grabbing ${isDragging ? "opacity-50" : ""}`}
		>
			<Icon className="size-4 text-muted-foreground" />
			<span>{label}</span>
		</button>
	);
}

// ─── Sortable section ────────────────────────────────────────────
function SortableSection({
	section,
	children,
}: {
	section: FormSection;
	children: React.ReactNode;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: section.id, data: { type: "section" } });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div ref={setNodeRef} style={style} className="rounded-lg border p-6 space-y-6 relative">
			<div className="flex justify-center -mt-3" {...listeners} {...attributes}>
				<GripVertical className="size-5 text-muted-foreground/50 rotate-90 cursor-grab" />
			</div>
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">{section.title}</h3>
				<Button variant="ghost" size="sm" className="size-8 p-0">
					<MoreHorizontal className="size-4" />
				</Button>
			</div>
			{children}
		</div>
	);
}

// ─── Canvas drop zone ────────────────────────────────────────────
function CanvasDropZone({ children }: { children: React.ReactNode }) {
	const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

	return (
		<div
			ref={setNodeRef}
			className={`max-w-xl mx-auto space-y-4 min-h-[200px] transition-colors rounded-lg ${isOver ? "ring-2 ring-primary/30 ring-dashed" : ""}`}
		>
			{children}
		</div>
	);
}

// ─── Drag overlay preview ────────────────────────────────────────
function DragOverlayContent({ type }: { type: string }) {
	if (type === "section") {
		return (
			<div className="rounded-lg border bg-card p-4 shadow-lg opacity-80 w-80">
				<h3 className="text-sm font-semibold">New section</h3>
			</div>
		);
	}
	const allItems = SIDEBAR_ITEMS.flatMap((c) => c.items);
	const item = allItems.find((i) => i.type === type);
	if (!item) return null;
	const Icon = item.icon;
	return (
		<div className="rounded-lg border bg-card px-4 py-3 shadow-lg opacity-80 flex items-center gap-3 w-72">
			<Icon className="size-4 text-muted-foreground" />
			<span className="text-sm">{item.label}</span>
		</div>
	);
}

// ─── Main page ───────────────────────────────────────────────────
const FormDetailPage = () => {
	const { formId } = useParams();
	const navigate = useNavigate();
	const [sections, setSections] = useState<FormSection[]>(DEFAULT_SECTIONS);
	const [activeType, setActiveType] = useState<string | null>(null);
	const [isDraggingFromSidebar, setIsDraggingFromSidebar] = useState(false);
	const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

	const deleteField = (sectionId: string, fieldId: string) => {
		setSections((prev) =>
			prev.map((s) =>
				s.id === sectionId
					? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
					: s
			)
		);
		if (editingFieldId === fieldId) setEditingFieldId(null);
	};

	const updateField = (fieldId: string, updates: Partial<FormField>) => {
		setSections((prev) =>
			prev.map((s) => ({
				...s,
				fields: s.fields.map((f) =>
					f.id === fieldId ? { ...f, ...updates } : f
				),
			}))
		);
	};

	const { data: forms = [] } = useQuery({
		queryKey: ["request-forms"],
		queryFn: getRequestForms,
	});

	const form = forms.find((f) => f.id === formId);

	const sectionIds = sections.map((s) => s.id);
	const isDraggingField = isDraggingFromSidebar && activeType !== null && activeType !== "section";

	const handleDragStart = (event: DragStartEvent) => {
		const data = event.active.data.current;
		if (data?.origin === "sidebar") {
			setActiveType(data.type);
			setIsDraggingFromSidebar(true);
		} else {
			setActiveType(null);
			setIsDraggingFromSidebar(false);
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveType(null);
		setIsDraggingFromSidebar(false);

		if (!over) return;

		const activeData = active.data.current;

		// Drag from sidebar → canvas
		if (activeData?.origin === "sidebar") {
			const type = activeData.type as string;
			const overId = over.id as string;

			if (type === "section") {
				const newSection: FormSection = {
					id: genId("section"),
					title: "New section",
					fields: [],
				};

				// Sections can only be dropped on drop indicators or the canvas itself
				if (overId.startsWith("drop-")) {
					const idx = parseInt(overId.split("-")[1]);
					const newSections = [...sections];
					newSections.splice(idx, 0, newSection);
					setSections(newSections);
					return;
				}

				if (overId === "canvas") {
					setSections([...sections, newSection]);
				}
				// Ignore drops on sections or fields — sections can't nest
				return;
			}

			// It's a field type — add to the section it was dropped on
			const newField: FormField = {
				id: genId("field"),
				type: type as FieldType,
				label: SIDEBAR_ITEMS.flatMap((c) => c.items).find((i) => i.type === type)?.label ?? type,
			};

			// Auto-enter editing mode for newly dropped fields
			setEditingFieldId(newField.id);

			// Dropped on a field drop indicator inside a section
			if (overId.startsWith("field-drop-")) {
				const parts = overId.replace("field-drop-", "").split("-");
				const fieldIdx = parseInt(parts.pop()!);
				const sectionId = parts.join("-");
				setSections((prev) =>
					prev.map((s) => {
						if (s.id !== sectionId) return s;
						const newFields = [...s.fields];
						newFields.splice(fieldIdx, 0, newField);
						return { ...s, fields: newFields };
					})
				);
				return;
			}

			// Dropped on a drop indicator between sections — add to section above
			if (overId.startsWith("drop-")) {
				const idx = parseInt(overId.split("-")[1]);
				const targetIdx = Math.min(idx, sections.length - 1);
				if (targetIdx >= 0) {
					setSections((prev) =>
						prev.map((s, i) =>
							i === targetIdx ? { ...s, fields: [...s.fields, newField] } : s
						)
					);
				}
				return;
			}

			const targetSectionId = findSectionId(overId);
			if (targetSectionId) {
				setSections((prev) =>
					prev.map((s) =>
						s.id === targetSectionId ? { ...s, fields: [...s.fields, newField] } : s
					)
				);
			} else if (sections.length > 0) {
				// Drop on canvas but not on a specific section — add to last section
				setSections((prev) => {
					const updated = [...prev];
					updated[updated.length - 1] = {
						...updated[updated.length - 1],
						fields: [...updated[updated.length - 1].fields, newField],
					};
					return updated;
				});
			}
			return;
		}

		// Reorder sections
		const activeId = active.id as string;
		const overId = over.id as string;

		if (activeData?.type === "section" && sectionIds.includes(activeId) && sectionIds.includes(overId)) {
			const oldIndex = sectionIds.indexOf(activeId);
			const newIndex = sectionIds.indexOf(overId);
			if (oldIndex !== newIndex) {
				setSections(arrayMove(sections, oldIndex, newIndex));
			}
			return;
		}

		// Reorder fields within same section
		if (activeData?.type === "field") {
			const activeSectionId = findSectionIdForField(activeId);
			const overSectionId = findSectionIdForField(overId) ?? findSectionId(overId);

			if (activeSectionId && overSectionId && activeSectionId === overSectionId) {
				setSections((prev) =>
					prev.map((s) => {
						if (s.id !== activeSectionId) return s;
						const fieldIds = s.fields.map((f) => f.id);
						const oldIndex = fieldIds.indexOf(activeId);
						const newIndex = fieldIds.indexOf(overId);
						if (oldIndex === -1 || newIndex === -1) return s;
						return { ...s, fields: arrayMove(s.fields, oldIndex, newIndex) };
					})
				);
			} else if (activeSectionId && overSectionId && activeSectionId !== overSectionId) {
				// Move field between sections
				setSections((prev) => {
					const sourceSection = prev.find((s) => s.id === activeSectionId)!;
					const field = sourceSection.fields.find((f) => f.id === activeId)!;
					return prev.map((s) => {
						if (s.id === activeSectionId) {
							return { ...s, fields: s.fields.filter((f) => f.id !== activeId) };
						}
						if (s.id === overSectionId) {
							const overFieldIndex = s.fields.findIndex((f) => f.id === overId);
							const newFields = [...s.fields];
							if (overFieldIndex >= 0) {
								newFields.splice(overFieldIndex, 0, field);
							} else {
								newFields.push(field);
							}
							return { ...s, fields: newFields };
						}
						return s;
					});
				});
			}
		}
	};

	const findSectionId = (id: string): string | null => {
		if (sectionIds.includes(id)) return id;
		for (const section of sections) {
			if (section.fields.some((f) => f.id === id)) return section.id;
		}
		return null;
	};

	const findSectionIdForField = (fieldId: string): string | null => {
		for (const section of sections) {
			if (section.fields.some((f) => f.id === fieldId)) return section.id;
		}
		return null;
	};

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header bar */}
			<header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="sm" onClick={() => navigate("/settings/requests-bookings")}>
						<ArrowLeft className="size-4" />
					</Button>
					<h1 className="text-lg font-semibold">{form?.name ?? "Form Details"}</h1>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={() => navigate("/settings/requests-bookings")}>
						Cancel
					</Button>
					<Button size="sm">Save</Button>
				</div>
			</header>

			<DndContext
				collisionDetection={pointerWithin}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				{/* Canvas area */}
				<div className="flex-1 flex gap-4 p-4 overflow-hidden">
					{/* Left card - Form canvas */}
					<div className="flex-1 rounded-lg border bg-card p-8 overflow-y-auto" onClick={() => setEditingFieldId(null)}>
						<CanvasDropZone>
							<SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
								<DropIndicator id="drop-0" isDragging={isDraggingFromSidebar && activeType === "section"} />
								{sections.map((section, index) => (
									<div key={section.id}>
										<SortableSection section={section}>
											<SortableContext
												items={section.fields.map((f) => f.id)}
												strategy={verticalListSortingStrategy}
											>
												<DropIndicator id={`field-drop-${section.id}-0`} isDragging={isDraggingField} />
												{section.fields.map((field, fieldIndex) => (
													<div key={field.id}>
														<FieldWrapper
															field={field}
															isEditing={editingFieldId === field.id}
															onSelect={() => setEditingFieldId(field.id)}
															onUpdate={(updates) => updateField(field.id, updates)}
															onDelete={() => deleteField(section.id, field.id)}
														/>
														<DropIndicator id={`field-drop-${section.id}-${fieldIndex + 1}`} isDragging={isDraggingField} />
													</div>
												))}
											</SortableContext>
										</SortableSection>
										<DropIndicator id={`drop-${index + 1}`} isDragging={isDraggingFromSidebar && activeType === "section"} />
									</div>
								))}
							</SortableContext>
							{sections.length === 0 && !isDraggingFromSidebar && (
								<div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">
									Drag a section or field here to get started
								</div>
							)}
						</CanvasDropZone>
					</div>

					{/* Right card */}
					<div className="w-[30%] shrink-0 rounded-lg border bg-card p-6 overflow-y-auto">
						<h2 className="text-lg font-semibold mb-4">Manage form</h2>
						<Tabs defaultValue="questions">
							<TabsList className="w-full mb-4">
								<TabsTrigger value="questions" className="flex-1">Add Questions</TabsTrigger>
								<TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
							</TabsList>
							<TabsContent value="questions" className="space-y-6 overflow-y-auto max-h-[calc(100vh-14rem)]">
								{SIDEBAR_ITEMS.map((group) => (
									<div key={group.category} className="space-y-2">
										<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
											{group.category}
										</p>
										{group.description && (
											<p className="text-xs text-muted-foreground">{group.description}</p>
										)}
										<div className="space-y-0.5">
											{group.items.map((item) => (
												<SidebarDraggableItem
													key={item.type}
													type={item.type}
													label={item.label}
													icon={item.icon}
												/>
											))}
										</div>
									</div>
								))}
							</TabsContent>
							<TabsContent value="settings" className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="formTitle">Form title</Label>
									<Input id="formTitle" placeholder="Enter form title" defaultValue={form?.name ?? ""} />
								</div>
								<div className="space-y-2">
									<Label htmlFor="formDesc">Form description</Label>
									<Textarea id="formDesc" placeholder="Enter form description" defaultValue={form?.description ?? ""} />
								</div>
							</TabsContent>
						</Tabs>
					</div>
				</div>

				<DragOverlay dropAnimation={null}>
					{activeType ? <DragOverlayContent type={activeType} /> : null}
				</DragOverlay>
			</DndContext>
		</div>
	);
};

export default FormDetailPage;
