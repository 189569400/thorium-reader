// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { PublicationView } from "readium-desktop/common/views/publication";
import { TPublicationApiExportPublication } from "readium-desktop/main/api/publication";
import { apiFetch } from "readium-desktop/renderer/apiFetch";
import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/hoc/translator";

interface IProps extends TranslatorProps {
    publication: PublicationView;
    exportPublication?: TPublicationApiExportPublication;
    onClick: () => void;
}

class PublicationExportButton extends React.Component<IProps> {
    private exportInputRef: React.RefObject<any>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            menuOpen: false,
        };
        this.exportInputRef = React.createRef();
    }

    public componentDidMount() {
        // Property 'directory' does not exist on type 'HTMLInputElement'
        this.exportInputRef.current.directory = true;
        this.exportInputRef.current.webkitdirectory = true;
    }

    public render(): React.ReactElement<{}>  {
        const { __ } = this.props;
        const id = "exportInput" + this.props.publication.identifier;
        return (
                <span>
                    <input
                        role="menuitem"
                        id={ id }
                        ref={ this.exportInputRef }
                        type="file"
                        multiple
                        onChange={ this.onExport }
                    />
                    <label htmlFor={ id }>
                        { __("catalog.export")}
                    </label>
                </span>
        );
    }

    private onExport = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onClick();
        const destinationPath = event.target.files[0].path;
        const publication = this.props.publication;
        apiFetch("publication/exportPublication", publication, destinationPath).catch((error) => {
            console.error(`Error to fetch publication/exportPublication`, error);
        });
    }
}

export default withTranslator(PublicationExportButton);
/*withApi(
    PublicationExportButton,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "exportPublication",
                callProp: "exportPublication",
            },
        ],
    },
);*/
