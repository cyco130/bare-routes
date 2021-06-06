import React, {
	FC,
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
	createContext,
	useContext,
} from "react";

export interface RouterProps {
	/** Callback for rendering the view for a given URL */
	render(renderArgs: RouteRenderArgs): ReactNode | Promise<ReactNode>;
	/** Don't call render in initial render. Useful for hydrating after SSR. */
	skipInitialRender?: boolean;
}

export interface RouteRenderArgs {
	/** URL for which a view should be rendered */
	url: URL;
	/** This is for signaling when the route transition is aborted */
	abortSignal: AbortSignal;
	/** Navigate */
	navigate(
		to: string,
		options?: {
			replace?: boolean;
			scroll?: boolean;
		},
	): void;
	/** Force a rerender */
	rerender(): void;
}

export const Router: FC<RouterProps> = ({
	children,
	render,
	skipInitialRender = false,
}) => {
	interface RouterState {
		current: URL;
		next?: URL;
		shouldScroll?: boolean;
		content: ReactNode;
	}

	const [
		{ current, next, shouldScroll, content },
		setState,
	] = useState<RouterState>({
		current: new URL(window.location.href),
		next: skipInitialRender ? undefined : new URL(window.location.href),
		content: children,
	});

	const navigate = useCallback(
		(to: string, options?: { replace?: boolean; scroll?: boolean }) => {
			const url = new URL(to, current);

			if (url.origin !== current?.origin) {
				window.location.assign(to);
				return false;
			}

			if (
				url.pathname === current.pathname &&
				url.search === current.search &&
				url.hash !== current.hash
			) {
				window.location.assign(to);
				return false;
			}

			if (options?.replace) {
				window.history.replaceState(undefined, "", to);
			} else {
				window.history.pushState(undefined, "", to);
			}

			setState((old) => ({
				...old,
				next: url,
				shouldScroll: options?.scroll ?? true,
			}));

			return true;
		},
		[current],
	);

	useEffect(() => {
		if (!next) return;

		const abortController = new AbortController();
		let redirected = false;

		const renderResult = render({
			url: next,
			abortSignal: abortController.signal,
			navigate(to, options) {
				navigate(to, options);
				redirected = true;
			},
			rerender() {
				setState((old) => ({ ...old, next: old.current }));
			},
		});

		if (isPromise(renderResult)) {
			renderResult.then((result) => {
				if (abortController.signal.aborted) return;
				setState((old) => ({
					...old,
					current: next,
					next: undefined,
					content: result,
				}));
			});
		} else {
			setState((old) => ({
				...old,
				current: next,
				next: undefined,
				content: renderResult,
			}));
		}

		return () => {
			if (!redirected) abortController.abort();
		};
	}, [render, next, navigate]);

	useEffect(() => {
		if (shouldScroll) {
			if (current.hash && current.hash !== "#") {
				const element = document.getElementById(current.hash.slice(1));
				if (element) {
					element.scrollIntoView();
				} else {
					window.scrollTo({ left: 0, top: 0 });
				}
			} else {
				window.scrollTo({ left: 0, top: 0 });
			}
		}
	}, [current, shouldScroll]);

	useEffect(() => {
		function handlePopState() {
			setState((old) => ({
				...old,
				next: new URL(window.location.href),
			}));
		}

		window.addEventListener("popstate", handlePopState);

		() => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, []);

	const contextValue = useMemo<RouterInfo>(
		() => ({
			current,
			next,
			navigate,
		}),
		[current, navigate, next],
	);

	return (
		<RouterContext.Provider value={contextValue}>
			{content}
		</RouterContext.Provider>
	);
};

export interface RouteRenderArgs {
	/** URL for which a view should be rendered */
	url: URL;
	/** This is for signaling when the route transition is aborted */
	abortSignal: AbortSignal;
}

export interface ServerRouterProps {
	url: URL;
}

export const ServerRouter: FC<ServerRouterProps> = ({ children, url }) => {
	const contextValue = useMemo<RouterInfo>(
		() => ({
			current: url,
			navigate() {
				throw new Error("navigate() cannot be used on server side");
			},
		}),
		[url],
	);

	return (
		<RouterContext.Provider value={contextValue}>
			{children}
		</RouterContext.Provider>
	);
};

export interface RouterInfo {
	/** Route that is currently viewed */
	current: URL;
	/** Route to which a transition is underway */
	next?: URL;
	/** Navigate programmatically */
	navigate(
		to: string,
		options?: {
			replace?: boolean;
			scroll?: boolean;
		},
	): boolean;
}

const RouterContext = createContext<RouterInfo>({
	current: new URL("https://example.com"),
	navigate() {
		throw new Error("navigate() called outside of <Router />");
	},
});

/** Custom hook for tracking navigation status and programmatic navigation */
export function useRouter(): RouterInfo {
	return useContext(RouterContext);
}

function isPromise(value: unknown): value is Promise<unknown> {
	return typeof (value as Promise<ReactNode>).then === "function";
}
