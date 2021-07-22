"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports[Symbol.toStringTag] = "Module";
var React = require("react");
var ReactDOMServer = require("react-dom/server");
function _interopDefaultLegacy(e) {
  return e && typeof e === "object" && "default" in e ? e : { "default": e };
}
var React__default = /* @__PURE__ */ _interopDefaultLegacy(React);
var ReactDOMServer__default = /* @__PURE__ */ _interopDefaultLegacy(ReactDOMServer);
var App$1 = "* {\n  box-sizing: border-box;\n  margin: 0;\n}\n\nhtml,\nbody,\n#app {\n  width: 100%;\n  height: 100%;\n}\n\n.App {\n  text-align: center;\n}\n\n.App-logo {\n  height: 40vmin;\n  pointer-events: none;\n}\n\n.App-header {\n  background-color: #282c34;\n  min-width: 100vw;\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  font-size: calc(10px + 2vmin);\n  color: white;\n}\n\n.App-link {\n  color: #61dafb;\n}\n\n@keyframes App-logo-spin {\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(360deg);\n  }\n}\n\nbutton {\n  font-size: calc(10px + 2vmin);\n}\n";
var logo = "/assets/logo.ecc203fb.svg";
function App(props) {
  const [count, setCount] = React__default["default"].useState(0);
  React.useEffect(() => {
    console.log("First Render", props);
  }, []);
  return /* @__PURE__ */ React__default["default"].createElement("div", {
    className: "App"
  }, /* @__PURE__ */ React__default["default"].createElement("header", {
    className: "App-header"
  }, /* @__PURE__ */ React__default["default"].createElement("img", {
    src: logo,
    className: "App-logo",
    alt: "logo"
  }), /* @__PURE__ */ React__default["default"].createElement("p", null, "Hello Vite + React!"), /* @__PURE__ */ React__default["default"].createElement("p", null, /* @__PURE__ */ React__default["default"].createElement("button", {
    type: "button",
    onClick: () => setCount((count2) => count2 + 1)
  }, "count is: ", count)), /* @__PURE__ */ React__default["default"].createElement("p", null, "Edit ", /* @__PURE__ */ React__default["default"].createElement("code", null, "App.tsx"), " and save to test HMR updates."), /* @__PURE__ */ React__default["default"].createElement("p", null, /* @__PURE__ */ React__default["default"].createElement("a", {
    className: "App-link",
    href: "https://reactjs.org",
    target: "_blank",
    rel: "noopener noreferrer"
  }, "Learn React"), /* @__PURE__ */ React__default["default"].createElement("a", {
    className: "App-link",
    href: "https://vitejs.dev/guide/features.html",
    target: "_blank",
    rel: "noopener noreferrer"
  }, "Vite Docs"))));
}
function render(props) {
  return ReactDOMServer__default["default"].renderToString(/* @__PURE__ */ React__default["default"].createElement(App, __spreadValues({}, props)));
}
exports.default = App;
exports.render = render;
