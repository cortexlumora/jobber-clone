export interface APIResponse<T> {
	data: T;
	message?: string;
	error?: string;
}
