// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";

import { DisplayType, RouterLocationState } from "../utils/displayType";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
    name: string;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, RouteComponentProps {
}

class GridTagButton extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {

        let displayType = DisplayType.Grid;
        if (this.props.location?.state?.displayType) {
            displayType = this.props.location.state.displayType as DisplayType;
        //     console.log("this.props.location -- GridTagButton");
        //     console.log(this.props.location);
        //     console.log(this.props.location.state);
        // } else {
        //     console.log("XXX this.props.location -- GridTagButton");
        }

        return (
            <Link
            to={{
                pathname: `/library/search/tag/${this.props.name}`,
                search: "",
                hash: "",
                state: {
                    displayType,
                } as RouterLocationState,
                }}>
                {this.props.name}
                {/*<div id={style.count}>
                    {this.props.tag.length}
                </div>*/}
            </Link>
        );
    }
}

export default withRouter(GridTagButton);
