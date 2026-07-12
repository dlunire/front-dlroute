/**
 * DLUnire — @dlunire/front-dlroute
 * Copyright (c) 2026 David E. Luna M.
 *
 * SPDX-License-Identifier: MIT
 */

import * as routing from "./index";

type Dispatch = routing.Dispatch;
type Param = routing.Param;



routing.route("/users/:id", function (params: Param) {
    console.log({ test: true, route: '/users/:id', params, asset: routing.asset("/product.png") });
});

const dispatch: Dispatch = routing.dispatch();
let component: Function | null = dispatch.component as typeof Function | null;

if (typeof component !== "function") {
    component = () => {
        console.log({ status: "Not Found (404)" });
    }
}

component(dispatch.validated.param);