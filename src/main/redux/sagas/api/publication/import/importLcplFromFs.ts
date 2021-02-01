// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { promises as fsp } from "fs";
import * as path from "path";
import { lcpLicenseIsNotWellFormed } from "readium-desktop/common/lcp";
import { ToastType } from "readium-desktop/common/models/toast";
import { toastActions } from "readium-desktop/common/redux/actions";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { extractCrc32OnZip } from "readium-desktop/main/crc";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { call, put } from "redux-saga/effects";
import { SagaGenerator } from "typed-redux-saga";

import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";

import { downloader } from "../../../downloader";
import { importPublicationFromFS } from "./importPublicationFromFs";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/import/publicationLcplFromFs");

export function* importLcplFromFS(
    filePath: string,
    lcpHashedPassphrase?: string,
): SagaGenerator<[publicationDocument: PublicationDocument, alreadyImported: boolean]> {

    const lcpManager = diMainGet("lcp-manager");
    const publicationRepository = diMainGet("publication-repository");

    const jsonStr = yield* callTyped(() => fsp.readFile(filePath, { encoding: "utf8" }));
    const lcpJson = JSON.parse(jsonStr);

    if (lcpLicenseIsNotWellFormed(lcpJson)) {
        throw new Error(`LCP license malformed: ${JSON.stringify(lcpJson)}`);
    }

    const r2LCP = TaJsonDeserialize(lcpJson, LCP);
    r2LCP.JsonSource = jsonStr;
    r2LCP.init();

    // LCP license checks to avoid unnecessary download:
    // CERTIFICATE_SIGNATURE_INVALID = 102
    // CERTIFICATE_REVOKED = 101
    // LICENSE_SIGNATURE_DATE_INVALID = 111
    // LICENSE_SIGNATURE_INVALID = 112
    // (USER_KEY_CHECK_INVALID = 141) is guaranteed because of dummy passphrase
    // (LICENSE_OUT_OF_DATE = 11) occurs afterwards, so will only be checked after passphrase try
    if (r2LCP.isNativeNodePlugin()) {
        if (r2LCP.Rights) {
            const now = Math.floor(Date.now() / 1000);

            const end = new Date(r2LCP.Rights.End).getTime() / 1000;
            const start = new Date(r2LCP.Rights.Start).getTime() / 1000;

            debug("NOW", now);
            debug("END", end);
            debug("START", start);
            let res = 0;
            try {
                if (r2LCP.Rights.Start) {
                    if (start - now > 0) {
                        res = 11;
                    }
                }
                if (r2LCP.Rights.End) {
                    if (now - end > 0) {
                        res = 11;
                    }
                }
            } catch (err) {
                debug(err);
            }
            if (res) {
                const msg = lcpManager.convertUnlockPublicationResultToString(res);
                yield put(
                    toastActions.openRequest.build(
                        ToastType.Error, msg,
                    ),
                );
                throw new Error(`[${msg}] (${filePath})`);
            }
        }

        try {
            // await r2LCP.tryUserKeys([toSha256Hex("READIUM2-DESKTOP-THORIUM-DUMMY-PASSPHRASE")]);
            yield call(() => r2LCP.dummyCreateContext());
        } catch (err) {
            if (err !== 141) { // USER_KEY_CHECK_INVALID
                // CERTIFICATE_SIGNATURE_INVALID = 102
                // CERTIFICATE_REVOKED = 101
                // LICENSE_SIGNATURE_DATE_INVALID = 111
                // LICENSE_SIGNATURE_INVALID = 112
                const msg = lcpManager.convertUnlockPublicationResultToString(err);
                yield put(
                    toastActions.openRequest.build(
                        ToastType.Error, msg,
                    ),
                );
                throw new Error(`[${msg}] (${filePath})`);
            }
        }
    }

    const link = r2LCP?.Links?.reduce((pv, cv) => cv.Rel === "publication" ? cv : pv);

    if (link?.Href) {

        const title = link.Title || path.basename(filePath);
        const [downloadFilePath] = yield* callTyped(downloader, [{ href: link.Href, type: link.Type }], title);

        // inject LCP license into temporary downloaded file, so that we can check CRC
        // caveat: processStatusDocument() which is invoked later
        // can potentially update LCP license with latest from server,
        // so not a complete guarantee of match with an already-imported LCP EPUB.
        // Plus, such already-existing EPUB in the local bookshelf may or may not
        // include the latest injected LCP license! (as it only gets updated during user interaction
        // such as when opening the publication information dialog, and of course when reading the EPUB)

        // return this.lcpManager.injectLcpl(publicationDocument, r2LCP);
        if (downloadFilePath) {

            yield call(() => lcpManager.injectLcplIntoZip(downloadFilePath, r2LCP));
            const hash = yield* callTyped(() => extractCrc32OnZip(downloadFilePath));
            const [pubDocument] = yield* callTyped(() => publicationRepository.findByHashId(hash));

            debug("importLcplFromFS", hash);
            if (pubDocument) {

                return [pubDocument, true];
            }

            const publicationDocument = yield* callTyped(
                () => importPublicationFromFS(downloadFilePath, hash, lcpHashedPassphrase));

            return [publicationDocument, false];

        } else {
            throw new Error("download path undefined");
        }

    } else {
        throw new Error("no download publication link");
    }
}
