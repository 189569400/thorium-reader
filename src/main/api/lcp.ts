// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import { lcpActions } from "readium-desktop/common/redux/actions";
import * as readerActions from "readium-desktop/common/redux/actions/reader";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { LcpManager } from "readium-desktop/main/services/lcp";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import { RootState } from "readium-desktop/renderer/redux/states";
import { Store } from "redux";

import { Server } from "@r2-streamer-js/http/server";

// import { IHttpGetResult } from "readium-desktop/common/utils/http";

const debug = debug_("readium-desktop:main:redux:sagas:streamer");

export interface ILcpApi {
    // renewPublicationLicense: (data: any) => Promise<void>;
    // registerPublicationLicense: (data: any) => Promise<void>;
    // returnPublication: (data: any) => Promise<void>;
    // getLsdStatus: (data: any) => Promise<IHttpGetResult<string, any>>;
    unlockPublicationWithPassphrase: (data: any) => Promise<void>;
}

// export type TLcpApiRenewPublicationLicense = ILcpApi["renewPublicationLicense"];
// export type TLcpApiRegisterPublicationLicense = ILcpApi["registerPublicationLicense"];
// export type TLcpApiReturnPublication = ILcpApi["returnPublication"];
// export type TLcpApiGgetLsdStatus = ILcpApi["getLsdStatus"];
export type TLcpApiUnlockPublicationWithPassphrase = ILcpApi["unlockPublicationWithPassphrase"];

export interface ILcpModuleApi {
    // "lcp/renewPublicationLicense": TLcpApiRenewPublicationLicense;
    // "lcp/registerPublicationLicense": TLcpApiRegisterPublicationLicense;
    // "lcp/returnPublication": TLcpApiReturnPublication;
    // "lcp/getLsdStatus": TLcpApiGgetLsdStatus;
    "lcp/unlockPublicationWithPassphrase": TLcpApiUnlockPublicationWithPassphrase;
}

@injectable()
export class LcpApi {
    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    @inject(diSymbolTable["lcp-manager"])
    private readonly lcpManager!: LcpManager;

    @inject(diSymbolTable["publication-view-converter"])
    private readonly publicationViewConverter!: PublicationViewConverter;

    @inject(diSymbolTable["publication-storage"])
    private readonly publicationStorage!: PublicationStorage;

    @inject(diSymbolTable.streamer)
    private readonly streamer!: Server;

    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

    // public async renewPublicationLicense(data: any): Promise<void> {
    //     const { publication } = data;
    //     const publicationDocument = await this.publicationRepository.get(
    //         publication.identifier,
    //     );
    //     await this.lcpManager.renewPublicationLicense(publicationDocument);
    // }

    // public async registerPublicationLicense(data: any): Promise<void> {
    //     const { publication } = data;
    //     const publicationDocument = await this.publicationRepository.get(
    //         publication.identifier,
    //     );
    //     await this.lcpManager.registerPublicationLicense(publicationDocument);
    // }

    // public async returnPublication(data: any): Promise<void> {
    //     const { publication } = data;
    //     const publicationDocument = await this.publicationRepository.get(
    //         publication.identifier,
    //     );
    //     await this.lcpManager.returnPublicationLicense(publicationDocument);
    // }

    // public async getLsdStatus(data: any) {
    //     const { publication } = data;
    //     return await this.lcpManager.getLsdStatus(publication);
    // }

    public async unlockPublicationWithPassphrase(data: any) {
        const { publication, passphrase } = data;
        try {
            const unlockPublicationRes: string | number | null | undefined =
                await this.lcpManager.unlockPublication(publication, passphrase);
            if (typeof unlockPublicationRes !== "undefined") {
                const message = this.lcpManager.convertUnlockPublicationResultToString(unlockPublicationRes);
                debug(message);
                const publicationDocument = await this.publicationRepository.get(publication.identifier);
                const publicationView = this.publicationViewConverter.convertDocumentToView(publicationDocument);
                const epubPath = this.publicationStorage.getPublicationEpubPath(publicationDocument.identifier);
                const r2Publication = await this.streamer.loadOrGetCachedPublication(epubPath);
                if (!r2Publication.LCP) {
                    return;
                }
                try {
                    const action = lcpActions.checkUserKey(
                        publicationView,
                        r2Publication.LCP.Encryption.UserKey.TextHint,
                        message,
                    );
                    this.store.dispatch(action);
                    return;
                } catch (error) {
                    debug(error);
                    return;
                }
            }
        } catch (err) {
            debug(err);
            return;
        }

        this.store.dispatch(readerActions.open(publication));
    }
}
