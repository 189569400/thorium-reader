// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable } from "inversify";
import * as PouchDB from "pouchdb-core";
import { Identifiable } from "readium-desktop/common/models/identifiable";
import { Timestampable } from "readium-desktop/common/models/timestampable";
import { LocatorDocument } from "readium-desktop/main/db/document/locator";

import { BaseRepository, DatabaseContentType } from "./base";

const PUBLICATION_INDEX = "publication_index";
const LOCATOR_TYPE_INDEX = "locator_type_index";
const CREATED_AT_INDEX = "created_at_index";
const UPDATED_AT_INDEX = "updatded_at_index";

export interface DatabaseContentTypeLocator extends DatabaseContentType, LocatorDocument {
}

@injectable()
export class LocatorRepository extends BaseRepository<LocatorDocument, DatabaseContentTypeLocator> {
    public constructor(db: PouchDB.Database<DatabaseContentTypeLocator>) {

        // See DatabaseContentTypeLocator
        const indexes = [
            {
                fields: ["createdAt"], // Timestampable
                name: CREATED_AT_INDEX,
            },
            {
                fields: ["updatedAt"], // Timestampable
                name: UPDATED_AT_INDEX,
            },
            {
                fields: ["publicationIdentifier"], // LocatorDocument
                name: PUBLICATION_INDEX,
            },
            {
                fields: ["locatorType"], // LocatorDocument
                name: LOCATOR_TYPE_INDEX,
            },
        ];

        super(db, "locator", indexes);
    }

    public async findByPublicationIdentifierAndLocatorType(
        publicationIdentifier: string,
        locatorType: string,
    ): Promise<LocatorDocument[]> {
        return this.find({
            selector: { publicationIdentifier, locatorType },
        });
    }

    public async findByPublicationIdentifier(
        publicationIdentifier: string,
    ): Promise<LocatorDocument[]> {
        return this.find({
            selector: { publicationIdentifier },
        });
    }

    public async findByLocatorType(
        locatorType: string,
    ): Promise<LocatorDocument[]> {
        return this.find({
            selector: { locatorType },
        });
    }

    protected convertToDocument(dbDoc: PouchDB.Core.Document<DatabaseContentTypeLocator>): LocatorDocument {
        return Object.assign(
            {},
            super.convertToMinimalDocument(dbDoc),
            {
                locator: dbDoc.locator,
                locatorType: dbDoc.locatorType,
                publicationIdentifier: dbDoc.publicationIdentifier,
                name: dbDoc.name,
            } as Omit<LocatorDocument, keyof Timestampable | keyof Identifiable>,
        );
    }
}
