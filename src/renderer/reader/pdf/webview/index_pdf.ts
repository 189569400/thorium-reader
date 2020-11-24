// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { ipcRenderer } from "electron";
import { PDFDocumentProxy } from "pdfjs-dist/types/display/api";

import {
    IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN, IEventPayload_R2_EVENT_WEBVIEW_KEYUP,
} from "@r2-navigator-js/electron/common/events";

import { eventBus } from "../common/eventBus";
import {
    IEventBusPdfPlayer, IPdfPlayerColumn, IPdfPlayerScale, IPdfPlayerView,
} from "../common/pdfReader.type";
import { pdfReaderInit } from "./init";
import { createLoadingIconElement } from "./loading";
import { pdfJs } from "./pdfjs";
import { IStore, storeInit } from "./store";

export interface IPdfState {
    view: IPdfPlayerView;
    scale: IPdfPlayerScale;
    column: IPdfPlayerColumn;
    lastPageNumber: number;
    displayPage: (pageNumber: number) => Promise<void>;
    pageSize: {
        width: number;
        height: number;
    };
}

export type IPdfStore = IStore<IPdfState>;
export type IPdfBus = IEventBusPdfPlayer<IEVState>;

export interface IEVState {
    store: IPdfStore | undefined;
    bus: IEventBusPdfPlayer<IEVState> | undefined;
    pdf: PDFDocumentProxy | undefined;
}

function main() {

    const rootElement = document.body;

    const evState: IEVState = {
        store: undefined,
        bus: undefined,
        pdf: undefined,
    };

    const defaultView: IPdfPlayerView = "paginated";
    const defaultScale: IPdfPlayerScale = "fit";
    const defaultCol: IPdfPlayerColumn = "1";
    const state: IPdfState = {
        view: defaultView,
        column: defaultCol,
        scale: defaultScale,
        lastPageNumber: 1,
        displayPage: () => Promise.resolve(),
        pageSize: {
            width: 0,
            height: 0,
        },
    };

    evState.store = storeInit(state);

    const bus: IPdfBus = eventBus<IEVState>(
        (key, ...a) => {
            const data = {
                key: JSON.stringify(key),
                payload: JSON.stringify(a),
            };

            ipcRenderer.sendToHost("pdf-eventbus", data);
        },
        (ev) => {
            ipcRenderer.on("pdf-eventbus", (_event, message) => {

                try {

                    const key = typeof message?.key !== "undefined" ? JSON.parse(message.key) : undefined;
                    const data = typeof message?.payload !== "undefined" ? JSON.parse(message.payload) : [];
                    console.log("ipcRenderer pdf-eventbus received", key, data);

                    if (Array.isArray(data)) {
                        ev(key, ...data);
                    }
                } catch (e) {
                    console.log("ipcRenderer pdf-eventbus received with parsing error", e);
                }

            });
        },
        evState,
    );

    evState.bus = bus;

    // ready dispatched from Reader.tsx when bus loaded
    // bus.subscribe("ready", () => () => {

    // });

    // start dispatched from webview dom ready
    bus.subscribe("start", () => async (pdfPath: string) => {

        console.log("bus.subscribe start pdfPath", pdfPath);

        const [enableLoading, disableLoading] = createLoadingIconElement(rootElement);
        enableLoading();

        evState.store.setState({
            pageSize: {
                width: document.body.clientWidth,
                height: document.body.clientHeight,
            },
        });

        evState.pdf = await pdfJs.getDocument(pdfPath).promise;

        await pdfReaderInit(
            rootElement,
            evState,
        );

        bus.dispatch("scale", defaultScale);
        bus.dispatch("view", defaultView);
        bus.dispatch("column", defaultCol);

        disableLoading();
        // send to reader.tsx ready to render pdf
        bus.dispatch("ready");
    });

    window.document.body.addEventListener("copy", (evt: ClipboardEvent) => {
        const selection = window.document.getSelection();
        if (selection) {
            const str = selection.toString();
            if (str) {
                evt.preventDefault();

                setTimeout(() => {
                    bus.dispatch("copy", str);
                }, 500);
            }
        }
    });

    window.document.documentElement.addEventListener("keydown", (_ev: KeyboardEvent) => {
        window.document.documentElement.classList.add("ROOT_CLASS_KEYBOARD_INTERACT");
    }, true);

    window.document.documentElement.addEventListener("mousedown", (_ev: MouseEvent) => {
        window.document.documentElement.classList.remove("ROOT_CLASS_KEYBOARD_INTERACT");
    }, true);

    const keyDownUpEventHandler = (name: "keydown" | "keyup") =>
        (ev: KeyboardEvent) => {
            const elementName = (ev.target && (ev.target as Element).nodeName) ?
                (ev.target as Element).nodeName : "";
            const elementAttributes: { [name: string]: string } = {};
            if (ev.target && (ev.target as Element).attributes) {
                // tslint:disable-next-line: prefer-for-of
                for (let i = 0; i < (ev.target as Element).attributes.length; i++) {
                    const attr = (ev.target as Element).attributes[i];
                    elementAttributes[attr.name] = attr.value;
                }
            }
            const payload = {
                altKey: ev.altKey,
                code: ev.code,
                ctrlKey: ev.ctrlKey,
                elementAttributes,
                elementName,
                key: ev.key,
                metaKey: ev.metaKey,
                shiftKey: ev.shiftKey,
            } as IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN | IEventPayload_R2_EVENT_WEBVIEW_KEYUP;

            bus.dispatch(name, payload);
        };

    window.document.addEventListener("keydown",
        keyDownUpEventHandler("keydown"),
        {
            capture: true,
            once: false,
            passive: false,
        });
    window.document.addEventListener("keyup",
        keyDownUpEventHandler("keyup"),
        {
            capture: true,
            once: false,
            passive: false,
        });

    window.document.addEventListener("wheel", (ev) => {
        ev.preventDefault();

        console.log(ev.deltaY);
        console.log(ev);
    });

}

document.addEventListener("DOMContentLoaded", () => {
    main();
});
