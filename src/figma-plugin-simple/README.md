# 🎨 React Boilerplate for Figma plugins ⚛️

![preview](https://user-images.githubusercontent.com/18498712/222872587-28fb60ea-9282-48f4-8984-3e80a4b1b140.jpeg)

## ❓ What is this?

This is a boilerplate for creating a Figma plugin using React and Typescript.

---

## Supports

- SASS (SCSS)
- CSS/SASS/SCSS Modules
- Typescript
- Import SVG images

---

## 📦 Latest packages versions

- `@figma/plugin-typings`: 1.68.0
- `react`: 18.2.0

---

## Structure

```
├── src
│   ├── app
│   │   ├── assets
│   │   ├── components
│   │   ├── styles
│   ├── controller
│   ├── App.tsx
│   ├── index.tsx
│   ├── index.html
├── manifest.json
├── .prettierrc.yml
├── declaration.d.ts
├── tsconfig.json
├── webpack.config.js
```

### src/app

This is where the main app is located. It is a React app that is rendered inside the Figma plugin.

### src/controller

This is where the Figma controller is located. It is a Typescript file that is used to communicate with the Figma API.


---

## 🛠️ How to use

1. Clone this repo
2. Run `yarn` or `npm install`
3. Run `yarn dev` or `npm run dev`
4. Go to Figma and add a new plugin (Plugins -> Development -> Import plugin from manifest…)
5. Run the plugin

---
   
## ⚙️ How to run

In the project directory, you can run:
- `yarn dev` or `npm run dev` to run the app in the development mode.
- `yarn build` or `npm run build` to build the app for production to the `build` folder.

---

## ❗ Important

- run `yarn build` or `npm run build` before publishing the plugin to Figma. This will optimize the code and remove unnecessary files.
- You'll need to restart plugin in Figma in order to see the changes during development.
- Do not forget to replace the name and id of the plugin in the `manifest.json` file before publication.

---
 
## 📣 Feedback

If you have any feedback, please reach out to me here in issues, or on [Twitter](https://twitter.com/PaveILaptev).
