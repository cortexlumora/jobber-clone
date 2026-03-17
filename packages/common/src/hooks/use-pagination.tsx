import { parseAsInteger, parseAsString, useQueryState } from "nuqs";

function usePagination(defaultValues : { page?: number; perPage?: number; search?: string }  ) {
	const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(defaultValues.page ?? 1));
	const [perPage, setPerPage] = useQueryState("per_page", parseAsInteger.withDefault(defaultValues.perPage ?? 20));
	const [search, setSearch] = useQueryState("search", parseAsString.withDefault(defaultValues.search ?? ""));

	return {
		page,
		setPage,
		perPage,
		setPerPage,
		search,
		setSearch,
	};
}

export { usePagination };
