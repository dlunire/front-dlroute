/**
 * DLUnire — @dlunire/front-dlroute
 * Copyright (c) 2026 David E. Luna M.
 *
 * SPDX-License-Identifier: MIT
 */
import * as routing from "./index";
routing.route("/users/:id", function (params) {
    console.log({ test: true, route: '/users/:id', params, asset: routing.asset("/product.png") });
});
const dispatch = routing.dispatch();
let component = dispatch.component;
if (typeof component !== "function") {
    component = () => {
        console.log({ status: "Not Found (404)" });
    };
}
component(dispatch.validated.param);
