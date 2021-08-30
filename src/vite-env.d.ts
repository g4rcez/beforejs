/// <reference types="vite/client" />

import React from "react";

declare global {
    interface Window {
        __SERVER_SIDE_PROPS__: any;
    }
}
