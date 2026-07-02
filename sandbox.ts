import * as routing from "./index";

routing.route("/ciencia", function () {
    console.log({ test: true, message: "Funciona" });
});

const component: Function | null = routing.dispatch().component as typeof Function | null;

console.log({ component, route: routing.getRoute().uri });
