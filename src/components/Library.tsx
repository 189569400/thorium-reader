import * as React from "react";
import { Store } from "redux";

import { Card, CardMedia, CardTitle} from "material-ui/Card";
import FlatButton from "material-ui/FlatButton";
import FontIcon from "material-ui/FontIcon";
import IconButton from "material-ui/IconButton";
import RaisedButton from "material-ui/RaisedButton";
import { blue500 } from "material-ui/styles/colors";

import { lazyInject } from "readium-desktop/renderer/di";

import { ipcRenderer } from "electron";
import { PUBLICATION_DOWNLOAD_REQUEST,
         PUBLICATION_DOWNLOAD_RESPONSE,
        } from "readium-desktop/events/ipc";
import { PublicationMessage } from "readium-desktop/models/ipc";
import { Publication } from "readium-desktop/models/publication";

import { Translator } from "readium-desktop/i18n/translator";
import { IAppState } from "readium-desktop/reducers/app";

import { Catalog } from "readium-desktop/models/catalog";

import * as ReactCardFlip from "react-card-flip";

interface ILibraryState {
    locale: string;
    list: boolean;
    isFlipped: boolean[];
}

interface ILibraryProps {
    catalog: Catalog;
}

const styles = {
    BookCard: {
        body: {
            display: "inline-block",
            height: 400,
            margin: "5px 5px",
            textAlign: "center",
            width: 210,
        },
        downloadButton: {
            top: "50%",
        },
        image: {
            height: 320,
            width: 210,
        },
        title: {
            overflow: "hidden",
            whiteSpace: "nowrap",
        },
        titleCard: {
            top: "320px",
        },
    },
    BookListElement: {
        body: {
            boxShadow: "rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px",
            fontFamily: "Roboto, sans-serif",
            margin: "5px 0px",
            width: "1200px",
        },
        column: {
            display: "inline-block",
            width: "250px",
        },
        container: {
            display: "inline-block",
            maxWidth: 1200,
            textAlign: "left",
        },
        description: {
            display: "inline-block",
            height: 120,
            marginLeft: "5px",
        },
        image: {
            display: "inline-block",
            float: "left",
            height: 120,
            width: 78,
        },
        title: {
            margin: "10px 0px",
        },
    },
    Library: {
        addButton: {
            float: "right",
            marginTop: "6px",
        },
        displayButton: {
            float: "right",
        },
        list: {
            textAlign: "center",
        },
        title: {
            display: "inline-block",
        },
        spinner: {
            top: "200px",
            fontSize: "40px",
        },
    },
};

function downloadEPUB(newPublication: Publication) {
    let publicationMessage: PublicationMessage = {publication: newPublication};

    ipcRenderer.send(PUBLICATION_DOWNLOAD_REQUEST, publicationMessage);
}

export default class Library extends React.Component<ILibraryProps, ILibraryState> {
    public state: ILibraryState;

    @lazyInject("translator")
    private translator: Translator;

    @lazyInject("store")
    private store: Store<IAppState>;

    private catalog: Catalog;

    constructor() {
        super();
        this.state = {
            isFlipped: [],
            list: false,
            locale: this.store.getState().i18n.locale,
        };

        ipcRenderer.on(PUBLICATION_DOWNLOAD_RESPONSE, (event: any, msg: PublicationMessage) => {
        console.log("Ceci est une réponse au download ! Haha :D", msg);
    });
    }

    public handleFront(id: any) {
        let newIsFlipped = this.state.isFlipped;
        newIsFlipped[id] = true;
        this.setState({ isFlipped: newIsFlipped });
    }

    public handleBack(id: any) {
        let newIsFlipped = this.state.isFlipped;
        newIsFlipped[id] = false;
        this.setState({ isFlipped: newIsFlipped });
    }

    public Spinner () {
        return (
            <FontIcon
                style = {styles.Library.spinner}
                className="fa fa-spinner fa-spin fa-3x fa-fw"
                color={blue500}
            />
        );
    }

    public BookListElement (props: any) {
            const publication: Publication = props.publication;

            let author: string = "";
            let image: string = "";

            if (publication.authors[0]) {
                author = publication.authors[0].name;
            }
            if (publication.cover) {
                image = publication.cover.url;
            }

            return (
                <div style={styles.BookListElement.body}>
                    <img style={styles.BookListElement.image} src={image} />
                    <div style={styles.BookListElement.description}>
                        <h4 style={styles.BookListElement.title}>{publication.title}</h4>
                        <div style={styles.BookListElement.column}>
                            <p>{author}</p>
                            <p>Editeur</p>
                        </div>
                            <FlatButton
                                style={styles.BookCard.downloadButton}
                                label={this.translator.translate("library.downloadButton")}
                                onClick={() => {downloadEPUB(publication); }}/>
                    </div>
                </div>
            );
    };

    public BookCard = (props: any) => {
            const publication = props.publication;
            let that = this;
            let id = props.publicationId;

            let author: string = "";
            let image: string = "";

            if (publication.authors[0]) {
                author = publication.authors[0].name;
            }
            if (publication.cover) {
                image = publication.cover.url;
            }

            return (
                <div style={styles.BookCard.body}>
                    <Card style={styles.BookCard.body}>
                        <CardMedia>
                            <div
                                style={styles.BookCard.image}
                                onMouseEnter={() => {this.handleFront(id); }}
                                onMouseLeave={() => {this.handleBack(id); }}>
                                <ReactCardFlip isFlipped={that.state.isFlipped[id]}>
                                    <div key="front" >
                                        <div>
                                            <img  style={styles.BookCard.image} src={image}/>
                                        </div>
                                    </div>
                                    <div key="back">
                                        <div
                                            style={styles.BookCard.image}
                                        >
                                            {props.downloadable ? (
                                                <div>
                                                    <FlatButton
                                                        style={styles.BookCard.downloadButton}
                                                        label={this.translator.translate("library.downloadButton")}
                                                        onClick={() => {downloadEPUB(publication); }}/>
                                                </div>
                                            ) : (
                                                <div>
                                                    <FlatButton
                                                    style={styles.BookCard.downloadButton}
                                                    label="Supprimer" />

                                                    <FlatButton
                                                    style={styles.BookCard.downloadButton}
                                                    label={"Favoris"}/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </ReactCardFlip>
                            </div>
                        </CardMedia>
                        <CardTitle
                            titleStyle={{whiteSpace: "nowrap", overflow: "hidden"}}
                            subtitleStyle={{whiteSpace: "nowrap", overflow: "hidden"}}
                            title={publication.title}
                            subtitle={author}
                        />
                    </Card>
                </div>
            );
    }

    public createCardList() {
        let list: any = [];
        let catalog = this.catalog;
        for (let i = 0; i < catalog.publications.length; i++) {
            list.push(<this.BookCard key={i}
                publicationId={i}
                downloadable={true}
                publication={catalog.publications[i]} />);
        }
        return list;
    }

    public createElementList() {
        let list: any = [];
        let catalogs = this.catalog;
        for (let i = 0; i < catalogs.publications.length; i++) {
            list.push(<this.BookListElement key={i} publication={catalogs.publications[i]}/>);
        }
        return <div style={styles.BookListElement.container}> {list} </div>;
    }

    public componentDidMount() {
        this.store.subscribe(() => {
            this.setState({
                locale: this.store.getState().i18n.locale,
            });
        });
    }

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate;
        const that = this;
        this.catalog = this.props.catalog;

        let listToDisplay: any;
        if (this.catalog) {
            if (this.state.list) {
                listToDisplay = this.createElementList();
            } else {
                listToDisplay = this.createCardList();
            }
        } else {
            listToDisplay = <this.Spinner/>;
        }

        return (
            <div>
                <div>
                    <h1 style={styles.Library.title}>{__("library.heading")}</h1>
                    <IconButton
                        style={styles.Library.displayButton}
                        touch={true} onClick={() => {
                            that.setState({list: true});
                        }}
                    >
                        <FontIcon className="fa fa-list" color={blue500} />
                    </IconButton>
                    <IconButton
                        style={styles.Library.displayButton}
                        touch={true}  onClick={() => {
                            that.setState({list: false});
                        }}
                    >
                        <FontIcon className="fa fa-th-large" color={blue500} />
                    </IconButton>
                    <RaisedButton label={__("library.add")} style={styles.Library.addButton} />
                </div >

                <div style={styles.Library.list}>
                    {listToDisplay}
                </div>
            </div>
        );
    }
}
