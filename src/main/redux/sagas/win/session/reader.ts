// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { error } from "readium-desktop/common/error";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { winActions } from "readium-desktop/main/redux/actions";
import { eventChannel, Task } from "redux-saga";
import { cancel, debounce, fork, put, take } from "redux-saga/effects";

// Logger
const filename_ = "readium-desktop:main:redux:sagas:win:session:reader";
const debug = debug_(filename_);

function* readerClosureManagement(action: winActions.session.registerReader.TAction) {

    const moveOrResizeTask: Task = yield fork(readerMoveOrResizeObserver, action);

    const readerWindow = action.payload.win;
    const identifier = action.payload.identifier;
    const channel = eventChannel<boolean>(
        (emit) => {

            const handler = () => emit(true);
            readerWindow.on("close", handler);

            return () => {
                readerWindow.removeListener("close", handler);
            };
        },
    );

    // waiting for reader window to close
    yield take(channel);

    // cancel moveAndResizeObserver
    yield cancel(moveOrResizeTask);

    debug("event close requested -> emit unregisterReader and closed");
    yield put(winActions.reader.closed.build(identifier));
}

function* readerMoveOrResizeObserver(action: winActions.session.registerReader.TAction) {

    const reader = action.payload.win;
    const id = action.payload.identifier;
    const DEBOUNCE_TIME = 500;

    const channel = eventChannel<boolean>(
        (emit) => {

            const handler = () => emit(true);

            reader.on("move", handler);
            reader.on("resize", handler);

            return () => {
                reader.removeListener("move", handler);
                reader.removeListener("resize", handler);
            };
        },
    );

    yield debounce(DEBOUNCE_TIME, channel, function*() {

        try {
            const winBound = reader.getBounds();
            yield put(winActions.session.setBound.build(id, winBound));
        } catch (e) {
            debug("set reader bound error", id, e);
        }
    });
}

export function saga() {
    return takeSpawnLeading(
        winActions.session.registerReader.ID,
        readerClosureManagement,
        (e) => error(filename_ + ":readerClosureManagement", e),
    );
}
