import { Plus } from "lucide-react";
import React from "react";

const AddSectionContainer = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="flex">
			<div className="padding p-2 px-4 gap-4 flex items-center bg-gray-50 border rounded-xl">
				<div className="flex items-center justify-center gap-2">
					<Plus className="size-5" />
					Add Section
				</div>
				<div className="flex items-center gap-2">{children}</div>
			</div>
		</div>
	);
};

export default AddSectionContainer;
