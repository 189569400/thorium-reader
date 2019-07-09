// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import * as BackIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_back-24px-grey.svg";
import * as AudioIcon from "readium-desktop/renderer/assets/icons/baseline-volume_up-24px.svg";
import * as SettingsIcon from "readium-desktop/renderer/assets/icons/font-size.svg";
import * as TOCIcon from "readium-desktop/renderer/assets/icons/open_book.svg";
import * as MarkIcon from "readium-desktop/renderer/assets/icons/outline-bookmark_border-24px.svg";
import * as DetachIcon from "readium-desktop/renderer/assets/icons/outline-flip_to_front-24px.svg";
import * as InfosIcon from "readium-desktop/renderer/assets/icons/outline-info-24px.svg";
import * as FullscreenIcon from "readium-desktop/renderer/assets/icons/sharp-crop_free-24px.svg";
import * as QuitFullscreenIcon from "readium-desktop/renderer/assets/icons/sharp-uncrop_free-24px.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import * as readerActions from "readium-desktop/common/redux/actions/reader";

import { withApi } from "../utils/api";

import { ReaderMode } from "readium-desktop/common/models/reader";
import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import ReaderMenu from "./ReaderMenu";
import ReaderOptions from "./ReaderOptions";

interface Props extends TranslatorProps {
    menuOpen: boolean;
    mode?: ReaderMode;
    settingsOpen: boolean;
    handleMenuClick: () => void;
    handleSettingsClick: () => void;
    fullscreen: boolean;
    handleFullscreenClick: () => void;
    handleReaderClose: () => void;
    handleReaderDetach: () => void;
    toggleBookmark: any;
    isOnBookmark: boolean;
    displayPublicationInfo: any;
    readerMenuProps: any;
    readerOptionsProps: any;
}

export class ReaderHeader extends React.Component<Props, undefined> {
    private enableFullscreenRef: any;
    private disableFullscreenRef: any;
    private catchSettingFocus: any;
    private catchMenuFocus: any;

    public constructor(props: Props) {
        super(props);
    }

    public componentDidUpdate(oldProps: Props) {
        if (this.props.fullscreen !== oldProps.fullscreen) {
            if (this.props.fullscreen) {
                this.disableFullscreenRef.focus();
            } else {
                this.enableFullscreenRef.focus();
            }
        }

        if (this.props.settingsOpen !== oldProps.settingsOpen &&
            this.props.settingsOpen === false) {
                this.catchSettingFocus.focus();
        }

        if (this.props.menuOpen !== oldProps.menuOpen &&
            this.props.menuOpen === false) {
                this.catchMenuFocus.focus();
            }
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        return (
            <nav
                className={styles.main_navigation}
                role="navigation"
                aria-label={ __("accessibility.homeMenu")}
                {...(this.props.fullscreen && {style: {
                    backgroundColor: "transparent",
                    boxShadow: "none",
                }})}
            >
                <ul>
                    { !this.props.fullscreen ? <>
                        { (this.props.mode === ReaderMode.Attached) ? (
                            <li>
                                <button
                                    className={styles.menu_button}
                                    onClick={this.props.handleReaderClose}
                                >
                                    <SVG svg={BackIcon} title={ __("reader.navigation.backHomeTitle")}/>
                                </button>
                            </li>
                            ) : (<></>)
                        }
                        <li>
                            <button
                                className={styles.menu_button}
                                onClick={() => this.props.displayPublicationInfo()}
                            >
                                <SVG svg={InfosIcon} title={ __("reader.navigation.infoTitle")}/>
                            </button>
                        </li>
                        { (this.props.mode === ReaderMode.Attached) ? (
                            <li>
                                <button
                                    className={styles.menu_button}
                                    onClick={this.props.handleReaderDetach}
                                >
                                    <SVG svg={DetachIcon} title={ __("reader.navigation.detachWindowTitle")}/>
                                </button>
                            </li>
                            ) : (<></>)
                        }
                        <li  className={styles.right + " " + styles.blue}>
                            <button
                                className={styles.menu_button}
                                onClick={this.props.handleFullscreenClick}
                                ref={(ref) => this.enableFullscreenRef = ref}
                            >
                                <SVG svg={FullscreenIcon} title={ __("reader.navigation.fullscreenTitle")}/>
                            </button>
                        </li>
                        <li
                            className={styles.right}
                            {...(this.props.menuOpen && {style: {backgroundColor: "rgb(193, 193, 193)"}})}
                        >
                            <button
                                className={styles.menu_button}
                                onClick={this.props.handleMenuClick.bind(this)}
                                ref={(ref) => this.catchMenuFocus = ref}
                            >
                                <SVG svg={TOCIcon} title={ __("reader.navigation.openTableOfContentsTitle")}/>
                            </button>
                            <ReaderMenu {...this.props.readerMenuProps}/>
                        </li>
                        <li
                            className={styles.right}
                            {...(this.props.settingsOpen && {style: {backgroundColor: "rgb(193, 193, 193)"}})}
                        >
                            <button
                                className={styles.menu_button}
                                onClick={this.props.handleSettingsClick.bind(this)}
                                ref={(ref) => this.catchSettingFocus = ref}
                            >
                                <SVG svg={SettingsIcon} title={ __("reader.navigation.settingsTitle")}/>
                            </button>
                            <ReaderOptions {...this.props.readerOptionsProps}/>
                        </li>
                        <li
                            className={styles.right}
                            {...(this.props.isOnBookmark && {style: {backgroundColor: "rgb(193, 193, 193)"}})}
                        >
                            <button
                                className={styles.menu_button}
                                onClick={this.props.toggleBookmark}
                                {...(this.props.isOnBookmark && {style: {backgroundColor: "rgb(193, 193, 193)"}})}
                            >
                                <SVG svg={MarkIcon} title={ __("reader.navigation.bookmarkTitle")}/>
                            </button>
                        </li>
                        {/*<li className={styles.right}>
                            <button
                                className={styles.menu_button}
                            >
                                <SVG svg={AudioIcon} title={ __("reader.navigation.readBookTitle")}/>
                            </button>
                    </li>*/}
                    </> :
                    <li  className={styles.right}>
                        <button
                            className={styles.menu_button}
                            onClick={this.props.handleFullscreenClick}
                            ref={(ref) => this.disableFullscreenRef = ref}
                        >
                            <SVG svg={QuitFullscreenIcon} title={ __("reader.navigation.quitFullscreenTitle")}/>
                        </button>
                    </li>
                }
                </ul>
            </nav>
        );
    }
}

export default withTranslator(ReaderHeader);
