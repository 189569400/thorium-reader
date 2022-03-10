// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    TableInstance,
    UsePaginationInstanceProps,
    UsePaginationState,
} from "react-table";
import { Column, useTable, useFilters, useSortBy, usePagination } from "react-table";
import { formatTime } from "readium-desktop/common/utils/time";
import * as DOMPurify from "dompurify";
import * as moment from "moment";
import {
    formatContributorToString,
} from "readium-desktop/renderer/common/logics/formatContributor";
import { I18nTyped, Translator } from "readium-desktop/common/services/translator";
import * as React from "react";
import { connect } from "react-redux";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/library/apiSubscribe";
import BreadCrumb from "readium-desktop/renderer/library/components/layout/BreadCrumb";
import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { Unsubscribe } from "redux";

import Header from "../catalog/Header";

import { DisplayType, IRouterLocationState } from "readium-desktop/renderer/library/routing";

// import { GridView } from "readium-desktop/renderer/library/components/utils/GridView";
// import { ListView } from "readium-desktop/renderer/library/components/utils/ListView";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

interface IState {
    publicationViews: PublicationView[] | undefined;
}

export class AllPublicationPage extends React.Component<IProps, IState> {
    private unsubscribe: Unsubscribe;

    constructor(props: IProps) {
        super(props);
        this.state = {
            publicationViews: undefined,
        };
    }

    public componentDidMount() {
        this.unsubscribe = apiSubscribe([
            "publication/importFromFs",
            "publication/delete",
            "publication/importFromLink",
            // "catalog/addEntry",
            "publication/updateTags",
        ], () => {
            apiAction("publication/findAll")
                .then((publicationViews) => this.setState({publicationViews}))
                .catch((error) => console.error("Error to fetch api publication/findAll", error));
        });
    }

    public componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    public render(): React.ReactElement<{}> {
        const displayType = (this.props.location?.state && (this.props.location.state as IRouterLocationState).displayType) || DisplayType.Grid;

        const { __ } = this.props;
        const title = __("catalog.allBooks");

        const secondaryHeader = <Header />;
        const breadCrumb = <BreadCrumb breadcrumb={[{ name: __("catalog.myBooks"), path: "/library" }, { name: title }]}/>;

        return (
            <LibraryLayout
                title={`${__("catalog.myBooks")} / ${title}`}
                secondaryHeader={secondaryHeader}
                breadCrumb={breadCrumb}
            >
                <div style={{
                    overflow: "auto",
                    position: "absolute",
                    top: "0",
                    bottom: "0",
                    left: "0",
                    right: "0",
                    padding: "30px 60px",
                }}>
                    {
                        this.state.publicationViews ?
                            <TableView displayType={displayType} __={__} translator={this.props.translator} publicationViews={this.state.publicationViews} />
                            // (displayType === DisplayType.Grid ?
                            //     <GridView normalOrOpdsPublicationViews={this.state.publicationViews} /> :
                            //     <ListView normalOrOpdsPublicationViews={this.state.publicationViews} />)
                        : <></>
                    }
                </div>
            </LibraryLayout>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});

const commonCellStylesMax = (props: {displayType: DisplayType}): React.CSSProperties => {
    return {
        maxWidth: props.displayType === DisplayType.Grid ? "200px" : "150px",
        maxHeight: props.displayType === DisplayType.Grid ? "200px" : "100px",
    };
};
const commonCellStyles = (props: {displayType: DisplayType}): React.CSSProperties => {
    return {
        ...commonCellStylesMax(props),
        padding: "0.4em",
        overflowY: "scroll",
        textAlign: "center",
        userSelect: "text",
    };
};

const CellCoverImage: React.FC<{value: string, displayType: DisplayType}> = (props) => {
    return (<div style={{
        padding: "0",
        margin: "0",
        textAlign: "center",
    }}><img src={props.value} alt={""} role="presentation" style={{
        ...commonCellStylesMax(props),
    }} /></div>);
};
const CellDescription: React.FC<{value: string, displayType: DisplayType}> = (props) => {
    return (<div style={{
        ...commonCellStyles(props),
        paddingBottom: "0",
        marginBottom: "0.4em",
        minWidth: props.displayType === DisplayType.Grid ? "300px" : undefined,
        textAlign: props.displayType === DisplayType.Grid ? "justify" : "start",
    }} dangerouslySetInnerHTML={{__html: props.value}} />);
};
const TableCell: React.FC<{value: string, displayType: DisplayType}> = (props) => {
    return (<div style={{
        ...commonCellStyles(props),
    }}>
        {props.value}
    </div>);
};

// https://github.com/TanStack/react-table/issues/3064
// https://github.com/TanStack/react-table/issues/2912
// etc. :(
export type PaginationTableInstance<T extends object> = TableInstance<T> &
UsePaginationInstanceProps<T> & {
  state: UsePaginationState<T>;
};
interface TableView_IProps {
    publicationViews: PublicationView[];
    __: I18nTyped;
    translator: Translator;
    displayType: DisplayType;
}
interface IColumns {
    colCover: string;
    colTitle: string;
    colAuthors: string;
    colPublishers: string;
    colLanguages: string;
    colPublishedDate: string;
    colDescription: string;
    // colIdentifier: string;
    // colPublicationType: string;
    colLCP: string;
    colTags: string;
    colDuration: string;
    colProgression: string;
}
export const TableView: React.FC<TableView_IProps> = (props) => {

    const tableRows = React.useMemo<IColumns[]>(() => {
        return props.publicationViews.map((publicationView) => {

            // translator.translateContentField(author)
            const authors = publicationView.authors ? formatContributorToString(publicationView.authors, props.translator) : "";
            const publishers = publicationView.publishers ? formatContributorToString(publicationView.publishers, props.translator) : "";

            const publishedDate = publicationView.publishedAt ? moment(publicationView.publishedAt).year : ""; // .toISOString()

            const languages = publicationView.languages ? publicationView.languages.map((lang) => {

                // See FormatPublicationLanguage

                // Note: "pt-PT" in the i18next ResourceBundle is not captured because key match reduced to "pt"
                // Also: pt-pt vs. pt-PT case sensitivity
                // Also zh-CN (mandarin chinese)
                const l = lang.split("-")[0];

                // because dynamic label does not pass typed i18n compilation
                const translate = props.__ as (str: string) => string;

                // The backticks is not captured by the i18n scan script (automatic detection of translate("...") calls)
                const ll = translate(`languages.${l}`).replace(`languages.${l}`, lang);
                const note = (lang !== ll) ? ` (${lang})` : "";

                return ll + note;
            }).join(", ") : "";

            const description = publicationView.description ? DOMPurify.sanitize(publicationView.description) : "";

            const tags = publicationView.tags ? publicationView.tags.join(", ") : "";

            const lcp = publicationView.lcp ? "LCP" : "";

            const identifier = publicationView.workIdentifier ? publicationView.workIdentifier : "";

            const publicationType = publicationView.RDFType ? publicationView.RDFType : "";

            const duration = (publicationView.duration ? formatTime(publicationView.duration) : "") + (publicationView.nbOfTracks ? ` (${props.__("publication.audio.tracks")}: ${publicationView.nbOfTracks})` : "");

            // r2PublicationJson: JsonMap;
            // lastReadingLocation?: LocatorExtended;
            return {
                colCover: publicationView.cover?.thumbnailUrl ?? publicationView.cover?.coverUrl ?? "x",
                colTitle: publicationView.title,
                colAuthors: authors,
                colPublishers: publishers,
                colLanguages: languages,
                colPublishedDate: publishedDate,
                colDescription: description,
                colIdentifier: identifier,
                colPublicationType: publicationType,
                colLCP: lcp,
                colTags: tags,
                colDuration: duration,
                colProgression: "Progression",
            };
        }) as IColumns[];
    }, [props.publicationViews]);

    const tableColumns = React.useMemo<Column<IColumns>[]>(() => {
        const arr: Column<IColumns>[] = [
            {
                Header: props.__("publication.cover.img"),
                accessor: "colCover",
                Cell: CellCoverImage,
            },
            {
                Header: props.__("publication.title"),
                accessor: "colTitle",
            },
            {
                Header: props.__("publication.author"),
                accessor: "colAuthors",
            },
            {
                Header: props.__("catalog.publisher"),
                accessor: "colPublishers",
            },
            {
                Header: props.__("catalog.lang"),
                accessor: "colLanguages",
            },
            {
                Header: props.__("catalog.released"),
                accessor: "colPublishedDate",
            },
            {
                Header: props.__("catalog.description"),
                accessor: "colDescription",
                Cell: CellDescription,
            },
            // {
            //     Header: "Identifier",
            //     accessor: "colIdentifier",
            // },
            // {
            //     Header: "Type",
            //     accessor: "colPublicationType",
            // },
            {
                Header: "LCP (DRM)",
                accessor: "colLCP",
            },
            {
                Header: props.__("catalog.tags"),
                accessor: "colTags",
            },
            {
                Header: props.__("publication.duration.title"),
                accessor: "colDuration",
            },
            {
                Header: props.__("publication.progression.title"),
                accessor: "colProgression",
            },
        ];
        return arr;
    }, [props.displayType]);

    const tableInstance = useTable({
        columns: tableColumns,
        data: tableRows,
        defaultColumn: {
            Cell: TableCell,
        },
        initialState: {
            // @ts-expect-error TS2322
            pageSize: 10,
            pageIndex: 0,
        },
        // @xxts-expect-error TS2322
        // filterTypes,
    }, useSortBy); //, useFilters, usePagination) as PaginationTableInstance<object>;

    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;
    return (
        <table {...getTableProps()} style={{ fontSize: "90%", border: "solid 1px gray", borderRadius: "8px", padding: "4px", margin: "0", marginRight: "1em", borderSpacing: "0" }}>
            <thead>{headerGroups.map((headerGroup, index) =>
                (<tr key={`headtr_${index}`} {...headerGroup.getHeaderGroupProps()}>{
                headerGroup.headers.map((column, i) =>
                    // @ts-expect-error TS2322
                    (<th key={`headtrth_${i}`} {...column.getHeaderProps(column.id !== "colCover" ? column.getSortByToggleProps() : undefined)}
                        style={{
                            padding: "0.7em",
                            margin: "0",
                            paddingBottom: "1em",
                            background: "#eeeeee",
                            color: "black",
                            whiteSpace: "nowrap",
                        }}
                        ><span style={{ cursor: column.id !== "colCover" ? "pointer" : undefined }}>{
                            column.render("Header")
                        }</span>{column.id !== "colCover" ? (<span role="presentation" style={{ cursor: "pointer" }}>
                        {
                        // @ts-expect-error TS2322
                        column.isSorted ? column.isSortedDesc ? " ↓" : " ↑" : " ⇅"
                        }</span>) : (<></>)}</th>),
                )}</tr>),
            )}</thead>
            <tbody {...getTableBodyProps()}>{rows.map((row, index) => {
                prepareRow(row);
                return (<tr key={`bodytr_${index}`} {...row.getRowProps()} style={{
                    outlineColor: "#cccccc",
                    outlineOffset: "0px",
                    outlineStyle: "solid",
                    outlineWidth: "1px",
                }}>{row.cells.map((cell, i) => 
                    (<td key={`bodytrtd_${i}`} {...cell.getCellProps()}
                        style={{
                            padding: "0",
                            margin: "0",
                            border: "solid 1px #eeeeee",
                        }}
                        >{
                            cell.render("Cell", { displayType: props.displayType })
                        }</td>),
                    )}
                    </tr>
                );
            })}</tbody>
        </table>
    );
};

export default connect(mapStateToProps)(withTranslator(AllPublicationPage));
