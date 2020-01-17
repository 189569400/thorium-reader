// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { applyMiddleware, createStore, Store } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import createSagaMiddleware from "redux-saga";

import { reduxSyncMiddleware } from "readium-desktop/renderer/reader/redux/middleware/sync";
import { rootReducer, TIReaderRootState } from "readium-desktop/renderer/reader/redux/reducers";
import { rootSaga } from "readium-desktop/renderer/reader/redux/sagas";

export function initStore(): Store<TIReaderRootState> {
    const sagaMiddleware = createSagaMiddleware();
    const store = createStore(
        rootReducer(),
        composeWithDevTools(
            applyMiddleware(
                reduxSyncMiddleware,
                sagaMiddleware,
            ),
        ),
    );
    sagaMiddleware.run(rootSaga);
    return store;
}
