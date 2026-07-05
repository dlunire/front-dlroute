import * as routing from "./index";
routing.route("/ciencia", function () {
    console.log({ test: true, message: "Funciona" });
});
let component = routing.dispatch().component;
console.log({ component, route: routing.getRoute().uri });
if (typeof component !== "function") {
    component = () => {
        console.log({ status: "Not Found (404)" });
    };
}
component();
