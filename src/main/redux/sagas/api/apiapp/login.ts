// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { IApiappSearchResultView } from "readium-desktop/common/api/interface/apiappApi.interface";
import { call } from "typed-redux-saga/macro";
import { SagaGenerator } from "typed-redux-saga/dist";
import { authenticationRequestFromLibraryWebServiceURL } from "../../apiapp";

const debug = debug_("readium-desktop:main/redux/sagas/api/apiapp/login");

export function* login(libView: IApiappSearchResultView): SagaGenerator<void> {

    const res = yield* call(authenticationRequestFromLibraryWebServiceURL, libView.url);

    debug(res);
}
