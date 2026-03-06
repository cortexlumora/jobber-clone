import { RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import routes from "./app-routes";

const queryClient = new QueryClient();

const App = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={routes} />
		</QueryClientProvider>
	);
};

export default App;
