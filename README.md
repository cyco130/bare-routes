# bare-routes

`bare-routes` is a bare-bones client-side router for [React](https://reactjs.org) applications. For utmost flexibility, it doesn't provide any means for matching routes, dynamically importing modules, or fetching data. _You_ do all that in your `render` callback. `bare-routes` only handles the history API and the scroll position.

## Basic usage
The heart of `bare-routes` is the `Router` component. It has one required prop, `render` which is a callback that takes an object argument that contains a property names `url`, a built-in `URL` object, and does whatever is necessary for your application to render the new view. Typically it consists of inspecting `url.pathname` to locate the view module, fetch the required data to render the view component, and render it. `render` can return either a `ReactNode` or -more usefully- a promise that resolves to one. Here's a very simple example:

```tsx
const App = () => (
	<Router
		render={async ({ url }) => {
			try {
				const moduleName = findModuleNameForUrl(url);
				const viewModule = await import(`./view/${moduleName}`);
				const ViewComponent = viewModule.default;
				return <ViewComponent />;
			} catch (error) {
				return <p>Could not load view: {error.message}</p>;
			}
		}}
	>
		Loading...
	</Router>
);

function findModuleNameForUrl(url) {
	// Locate view module for this URL
}
```
