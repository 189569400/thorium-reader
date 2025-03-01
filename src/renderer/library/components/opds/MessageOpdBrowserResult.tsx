// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";

import * as React from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    title: string;
    message?: string;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

export default class MessageOpdBrowserResult extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { message, title } = this.props;
        return (
            <div className={stylesGlobal.text_center}>
                <h3>{title}</h3>
                {message ? <p>{message}</p> : <p>🙈</p>}
            </div>
        );
    }
}
