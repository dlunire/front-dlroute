import * as routing from "./index";

routing.route("/ciencia", function () {
    console.log({ test: true, message: "Funciona" });
});

let component: Function | null = routing.dispatch().component as typeof Function | null;

console.log({ component, route: routing.getRoute().uri });

if (typeof component !== "function") {
    component = () => {
        console.log({ status: "Not Found (404)" });
    }
}

component();