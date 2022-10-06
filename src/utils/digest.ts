// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { createHash } from "crypto";

function decimalToHex(d: number, padding: number) {
    let hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
        hex = "0" + hex;
    }

    return hex;
}

export const parseHeaderWWWAuthenticateForDigest = (v: string): { [s: string]: any } => {
    const a = v.trim().split(",");
    const b = a.map((q) => q.trim().split("="));
    const c = b.map((w) => w.length != 2 ? undefined : w.map((e) => e.trim().replace(/(^"|"$)/g, "")));
    const d = c.filter((r) => !!r);
    const e = d.reduce((pv, cv) => ({ ...pv, [cv[0]]: cv[1] }), {});
    return e;
};

export interface IDigestDataParsed {
    username: string,
    realm: string,
    nonce: string,
    algorithm: "MD5" | "MD5-sess" | undefined,
    qop: "auth" | "auth-int" | undefined,
    cnonce: string
    uri: string,
    nonceCount: string,
}

export const parseDigestString = (wwwAuthenticate: string): IDigestDataParsed => {

    const data = parseHeaderWWWAuthenticateForDigest(wwwAuthenticate);
    return {
        username: data["username"] || "",
        realm: data["realm"] || "",
        nonce: data["nonce"] || "",
        algorithm: data["algorithm"] === "MD5" ? "MD5" : data["algorithm"] === "MD5-sess" ? "MD5-sess" : undefined,
        qop: data["qop"] === "auth" ? "auth" : data["qop"] === "auth-int" ? "auth-int" : undefined,
        cnonce: data["cnonce"],
        uri: data["uri"],
        nonceCount: data["nonceCount"],
    };
};

export const digestAuthentication = ({
    username,
    password,
    nonce,
    qop,
    algorithm,
    realm,
    cnonce,
    uri,
    method,
    nonceCount,
}: {
    username: string,
    password: string,
    nonce: string,
    qop: string,
    algorithm: string,
    realm: string,
    cnonce: string,
    uri: string,
    method: string,
    nonceCount: string,
}) => {

    nonceCount = nonceCount ? decimalToHex(parseInt(nonceCount, 16) + 1, 8) : decimalToHex(1, 8);
    const ha1MD5 = createHash("md5").update(`${username}:${realm}:${password}`).digest("hex");
    const ha1 = algorithm === "MD5-sess" ? createHash("md5").update(`${ha1MD5}:${nonce}:${cnonce}`).digest("hex") : ha1MD5;
    const ha2 = createHash("md5").update(qop === "auth-int" ? "" : `${method}:${uri}`).digest("hex"); // qop === "auth-int" not supported what is entityBody?
    const response = createHash("md5").update((qop === "auth" || qop === "auth-int") ? `${ha1}:${nonce}:${nonceCount}:${cnonce}:${qop}:${ha2}` : `${ha1}:${nonce}:${ha2}`).digest("hex");
    const accessToken = `username="${username}", realm="${realm}", nonce="${nonce}", qop=${qop}, algorithm=${algorithm}, response="${response}", uri="${uri}", nc=${nonceCount}, cnonce="${cnonce}"`;

    return accessToken;
};
