// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";

import { zipWith } from "ramda";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { eventChannel, SagaIterator } from "redux-saga";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { put } from "redux-saga/effects";
import { call as callTyped, select as selectTyped } from "typed-redux-saga/macro";

import { IHighlight } from "@r2-navigator-js/electron/common/highlight";
import {
    highlightsClickListen, highlightsCreate, highlightsRemove,
} from "@r2-navigator-js/electron/renderer";

import { readerLocalActionHighlights } from "../../actions";
import {
    IHighlightHandlerState, IHighlightMounterState,
} from "readium-desktop/common/redux/states/renderer/highlight";

const debug = debug_("readium-desktop:renderer:reader:redux:sagas:highlight:mounter");

export function* mountHighlight(href: string, handlerState: IHighlightHandlerState[]): SagaIterator {

    const mounterStateMap = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.mounter);
    // if (!mounterStateMap?.length) {
    //     debug(`mountHighlight MOUNTER STATE EMPTY -- mounterStateMap: [${JSON.stringify(mounterStateMap)}]`);
    //     return;
    // }

    const handlerStateFiltered = handlerState.filter(
        ({ uuid: uuidHandlerState, href: hrefHandlerState }) =>
            hrefHandlerState === href &&
            // exclude already-mounted items
            !mounterStateMap.find(([uuid, mounterState]) => uuidHandlerState === uuid && mounterState.href === href),
    );

    if (!handlerStateFiltered.length) {
        debug(`mountHighlight NO MOUNTS TO DO -- href: [${href}] mounterStateMap: [${JSON.stringify(mounterStateMap)}] handlerState: [${JSON.stringify(handlerState)}]`);
        return;
    }

    const highlightDefinitions = handlerStateFiltered.map((v) => v.def);

    debug(`mountHighlight CREATE ... -- href: [${href}] highlightDefinitions: [${JSON.stringify(highlightDefinitions)}]`);

    const createdHighlights = yield* callTyped(highlightsCreate, href, highlightDefinitions);

    debug(`mountHighlight CREATED -- href: [${href}] createdHighlights: [${JSON.stringify(createdHighlights)}]`);

    const arrayProps = handlerStateFiltered.map((v) => ({uuid: v.uuid, href: v.href, type: v.type}));

    const mounted = zipWith(
        (props, highlight) => ({
            uuid: props.uuid,
            href: props.href,
            type: props.type,
            ref: highlight,
        } satisfies IHighlightMounterState),
        arrayProps,
        createdHighlights,
    ).filter((v) => v.ref);

    debug(`mountHighlight MOUNTED -- href: [${href}] mounted: [${JSON.stringify(mounted)}]`);

    yield put(readerLocalActionHighlights.mounter.mount.build(mounted));
}

export function* unmountHightlight(href: string, mountUUIDs: string[]): SagaIterator {

    // yield* callTyped(() => highlightsRemoveAll(href, ["search", "annotation"]));

    const mounterStateMap = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.mounter);
    if (!mounterStateMap?.length) {
        debug(`unmountHightlight MOUNTER STATE EMPTY -- mounterStateMap: [${JSON.stringify(mounterStateMap)}]`);
        return;
    }

    const mounterStateMapItems = mounterStateMap.filter(([uuid, mounterState]) => (mounterState.href === href && mountUUIDs.includes(uuid)));

    if (!mounterStateMapItems.length) {
        debug(`unmountHightlight CANNOT FIND MOUNTER -- href: [${href}] mountUUIDs: [${JSON.stringify(mountUUIDs)}] mounterStateMap: [${JSON.stringify(mounterStateMap)}]`);
        return;
    }

    const uuids = mounterStateMapItems.map(([uuid, _mounterState]) => ({ uuid }));
    const highlightIDs = mounterStateMapItems.map(([_uuid, mounterState]) => (mounterState.ref.id));

    debug(`unmountHightlight -- href: [${href}] uuids: [${JSON.stringify(uuids)}] highlightIDs: [${JSON.stringify(highlightIDs)}]`);

    yield* callTyped(() => highlightsRemove(href, highlightIDs));

    // pull all hightlight from state (pop)
    // navigator-js doesn't keep hightlight state beetween webview access
    yield put(readerLocalActionHighlights.mounter.unmount.build(uuids));
}

export type THighlightClick = [string, IHighlight];

export function getHightlightClickChannel() {
    const channel = eventChannel<THighlightClick>(
        (emit) => {

            const handler = (href: string, highlight: IHighlight) => {
                emit([href, highlight]);
            };

            highlightsClickListen(handler);

            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return () => {
                // no destrutor
            };
        },
    );

    return channel;
}
