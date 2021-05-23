import { render } from "react-dom";
import React, { FC, ReactNode } from "react";
import { NavLink, Router, RouteRenderArgs, useRouter } from "../lib";
import "./index.css";

const App: FC = ({ children }) => (
	<Router render={renderPage} skipInitialRender>
		{children}
	</Router>
);

function renderPage({ url }: RouteRenderArgs) {
	console.log("Rendering", url.pathname);

	return new Promise<ReactNode>((resolve) =>
		setTimeout(
			() =>
				resolve(
					<>
						<h1>Loaded path: {url.pathname}</h1>
						<nav>
							<ul>
								<li>
									<NavLink
										href="/"
										currentRouteClass="active-link"
										nextRouteClass="next-link"
									>
										Home
									</NavLink>
								</li>
								<li>
									<NavLink
										href="/x"
										currentRouteClass="active-link"
										nextRouteClass="next-link"
									>
										X
									</NavLink>
								</li>
								<li>
									<NavLink
										href="/y"
										currentRouteClass="active-link"
										nextRouteClass="next-link"
									>
										Y
									</NavLink>
								</li>
								<li>
									<NavLink
										href="/z"
										currentRouteClass="active-link"
										nextRouteClass="next-link"
									>
										Z
									</NavLink>
								</li>
							</ul>
						</nav>
						<LoadingIndicator />
					</>,
				),
			1000,
		),
	);
}

const LoadingIndicator: FC = () => {
	const { next } = useRouter();

	return next ? <p>Loading {next.href}</p> : <></>;
};

async function main() {
	const initial = await renderPage({
		abortSignal: new AbortController().signal,
		url: new URL(window.location.href),
		rerender() {
			// Do nothing
		},
	});
	render(<App>{initial}</App>, document.getElementById("app"));
}

main();
