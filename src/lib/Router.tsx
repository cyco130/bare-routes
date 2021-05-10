import React, {
	FC,
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";

export interface RouterProps {
	render(renderArgs: RouteRenderArgs): ReactNode | Promise<ReactNode>;
	skipInitialRender?: boolean;
}

export interface RouteRenderArgs {
	abortSignal: AbortSignal;
	url: URL;
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

			if (url.pathname === current.pathname && url.search === current.search) {
				if (url.hash !== current.hash) {
					window.location.assign(to);
				}
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

		const renderResult = render({
			url: next,
			abortSignal: abortController.signal,
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
			abortController.abort();
		};
	}, [render, next]);

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

function isPromise(value: unknown): value is Promise<unknown> {
	return typeof (value as Promise<ReactNode>).then === "function";
}

import { createContext, useContext } from "react";

export interface RouterInfo {
	current: URL;
	next?: URL;
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

export function useRouter(): RouterInfo {
	return useContext(RouterContext);
}