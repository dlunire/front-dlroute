/**
 * DLUnire — @dlunire/front-dlroute
 * Copyright (c) 2026 David E. Luna M.
 *
 * SPDX-License-Identifier: MIT
 */

import * as routing from "./index";

routing.route("/users/:id", function () {
    console.log({ test: true, route: '/users/:id' });
});

let component: Function | null = routing.dispatch().component as typeof Function | null;

if (typeof component !== "function") {
    component = () => {
        console.log({ status: "Not Found (404)" });
    }
}

component();