# Remote Tool Template (Module Federation)

This project is a template for creating standalone React applications designed to be loaded dynamically as remote tools (micro-frontends) into a shell application using Webpack Module Federation.

It includes a basic setup with React, TypeScript, and the necessary Module Federation configuration after ejecting from Create React App.

## How to Use This Template

1.  **Copy Template:** Copy this entire directory (`sample-tool` or whatever you rename it to) to a new location for your new tool.
2.  **Rename Directory:** Rename the copied directory to match your new tool's name (e.g., `my-cool-tool`).
3.  **Update `package.json`:**
    *   Open `package.json`.
    *   Change the `"name"` field from `"my-remote-tool"` to your actual tool's name (e.g., `"my-cool-tool"`).
4.  **Update Webpack Config (`config/webpack.config.js`):**
    *   Open `config/webpack.config.js`.
    *   **`name` (ModuleFederationPlugin):** Change `name: "myremotetool"` to a unique name for your tool (e.g., `name: "mycooltool"`). This **must** be unique across all your remote tools and **must** match the `scope` the shell application uses to load this tool (often derived from this name).
    *   **`output.publicPath`:**
        *   For local development or if you're unsure of the final URL, leave it as `publicPath: 'auto'`.
        *   **IMPORTANT:** Before building for production deployment, you **must** change this to the absolute URL where the built assets (`remoteEntry.js`, chunks, etc.) will be hosted. 
            *   Example for GitHub Pages: `publicPath: 'https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME/'` (remember the trailing slash!).
            *   Failure to set this correctly will cause chunk loading errors in the shell.
    *   **`exposes` (ModuleFederationPlugin):** If you rename the main component (`src/ToolApp.tsx`) or want to expose a different one, update the key (`"./ToolApp"`) and the path (`"./src/ToolApp"`) accordingly. The key is what the shell application will use to import the component.
5.  **Update Manifest (`public/manifest.json`):**
    *   Open `public/manifest.json`.
    *   Change `"name"` to the display name of your tool (e.g., `"My Cool Tool"`).
    *   Change the `"entry"` URL to point to the **final deployment location** of your `remoteEntry.js` file. Use the placeholders as a guide (e.g., `"https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME/remoteEntry.js"`).
    *   Update `"exposedModule"` if you changed the key in the `exposes` config in `webpack.config.js`.
6.  **Develop Your Tool:**
    *   Implement your tool's functionality within the `src` directory.
    *   You can rename `src/ToolApp.tsx` or structure your components however you like, as long as the component you want to expose is correctly referenced in the `exposes` section of `webpack.config.js`.
7.  **Replace Icon:** Replace the placeholder `public/icon.png` with your actual tool's icon (e.g., a 16x16 or 32x32 PNG).
8.  **Install Dependencies:** Run `npm install` (or `yarn install`).

## Development

*   `npm start`: Starts the development server (using `scripts/start.js`). Note: After ejecting, `react-scripts start` is replaced by `node scripts/start.js`.
    *   *Note:* By default, this might just show a blank page as `src/index.tsx` doesn't render anything specific. You might want to modify `src/index.tsx` temporarily to render your main tool component (`ToolApp`) if you want to develop it in isolation.

## Building

*   `npm run build`: Builds the app for production to the `build` folder.
    *   **Crucially, ensure `output.publicPath` in `config/webpack.config.js` is set to the correct deployment URL before running the final build for deployment.**

## Deployment (Example: GitHub Pages)

This template includes configuration for easy deployment to GitHub Pages using the `gh-pages` package.

1.  **Build:** `npm run build` (ensure `publicPath` is set!).
2.  **Deploy:** `npm run deploy`.
    *   This pushes the contents of the `build` folder to the `gh-pages` branch of your GitHub repository.
3.  **Configure GitHub Pages:** In your GitHub repository settings, enable Pages and set the source to the `gh-pages` branch and `/ (root)` folder.
4.  **Verify:** Your manifest should be available at `https://<user>.github.io/<repo>/manifest.json` and your `remoteEntry.js` at `https://<user>.github.io/<repo>/remoteEntry.js`.

## Integration with Shell Application

*   The shell application needs to fetch a list of tools, including the URL to this tool's `manifest.json`.
*   The shell reads the `manifest.json` to find the `entry` URL (`remoteEntry.js`) and the `exposedModule` key (`./ToolApp`).
*   The shell uses the Module Federation `name` (e.g., `mycooltool` from webpack config) as the `scope` to access the loaded remote on the `window` object (`window.mycooltool`).
*   The shell calls `window.mycooltool.init()` to initialize shared scopes and then `window.mycooltool.get('./ToolApp')` to get the component factory.

## Important Considerations

*   **Shared Dependencies:** Ensure the versions of `react`, `react-dom`, and any other shared libraries in this tool's `package.json` **exactly match** the versions used in your shell application. Mismatched versions, especially for React, are a common source of errors.
*   **Unique Names:** The Module Federation `name` in `webpack.config.js` must be unique across all remote tools loaded by the shell.
*   **`publicPath`:** Setting the `output.publicPath` correctly before the production build is essential for chunks to load correctly when the tool is hosted separately from the shell.
*   **Caching:** Browsers aggressively cache `remoteEntry.js` and chunks. Use hard refreshes (Ctrl+Shift+R) or clear cache in DevTools during development when testing updates.

This README was generated based on the CRA ejected template and Module Federation setup.
